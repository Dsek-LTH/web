// Package songs is the songbook domain - see DESIGN.md's Phase 3 ("Simple
// standalone CRUD") section. Ported from
// src/routes/(app)/songbook/*.
package songs

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/microcosm-cc/bluemonday"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/slug"
)

var (
	ErrNotFound     = errors.New("songs: not found")
	ErrInvalidInput = errors.New("songs: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

const defaultPageSize = 20

type Service struct {
	queries   *db.Queries
	sanitizer *bluemonday.Policy
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx), sanitizer: bluemonday.UGCPolicy()}
}

// canSeeDeleted mirrors the old app's canAccessDeletedSongs: only a caller
// holding SongDelete may request/see soft-deleted songs (list's
// includeDeleted, or a single song lookup that would otherwise 404).
func canSeeDeleted(ctx context.Context) bool {
	identity, ok := auth.FromContext(ctx)
	return ok && identity.Has(apinames.SongDelete)
}

// List and Get both require SongRead - unlike Markdown/Alert's public
// reads, the old Song ZModel gates ALL reads behind "song:read"
// (`@@allow("read", has(auth().policies, "song:read"))`), not just
// mutations - a real distinction to preserve, not an oversight to relax.
func (s *Service) List(ctx context.Context, params ListParams) ([]Song, int, error) {
	if err := auth.Require(ctx, apinames.SongRead); err != nil {
		return nil, 0, err
	}
	page := params.Page
	if page < 1 {
		page = 1
	}
	pageSize := params.PageSize
	if pageSize < 1 {
		pageSize = defaultPageSize
	}
	showDeleted := params.ShowDeleted && canSeeDeleted(ctx)

	search := dbutil.TextOrInvalid(params.Search)
	var categories []string
	if len(params.Categories) > 0 {
		categories = params.Categories
	}

	rows, err := s.queries.ListSongs(ctx, db.ListSongsParams{
		Search:      search,
		Categories:  categories,
		ShowDeleted: dbutil.ToBool(showDeleted),
		Limit:       int32(pageSize),
		Offset:      int32((page - 1) * pageSize),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list songs: %w", err)
	}
	total, err := s.queries.CountSongs(ctx, db.CountSongsParams{
		Search:      search,
		Categories:  categories,
		ShowDeleted: dbutil.ToBool(showDeleted),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count songs: %w", err)
	}

	songs := make([]Song, len(rows))
	for i, row := range rows {
		songs[i] = toSong(row)
	}
	pageCount := int((total + int64(pageSize) - 1) / int64(pageSize))
	return songs, pageCount, nil
}

func (s *Service) Get(ctx context.Context, slugStr string) (*Song, error) {
	if err := auth.Require(ctx, apinames.SongRead); err != nil {
		return nil, err
	}
	row, err := s.queries.GetSongBySlug(ctx, db.GetSongBySlugParams{
		Slug:           slugStr,
		IncludeDeleted: dbutil.ToBool(canSeeDeleted(ctx)),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get song: %w", err)
	}
	song := toSong(row)
	return &song, nil
}

func (s *Service) Create(ctx context.Context, in SongInput) (*Song, error) {
	if err := auth.Require(ctx, apinames.SongCreate); err != nil {
		return nil, err
	}
	if in.Title == "" || in.Lyrics == "" {
		return nil, invalidf("title and lyrics are required")
	}

	uniqueSlug, err := s.uniqueSlug(ctx, in.Title)
	if err != nil {
		return nil, err
	}

	row, err := s.queries.CreateSong(ctx, db.CreateSongParams{
		Title:    s.sanitizer.Sanitize(in.Title),
		Lyrics:   s.sanitizer.Sanitize(in.Lyrics),
		Melody:   dbutil.ToText(sanitizePtr(s.sanitizer, in.Melody)),
		Category: dbutil.ToText(in.Category),
		Video:    dbutil.ToText(in.Video),
		Slug:     uniqueSlug,
	})
	if err != nil {
		return nil, fmt.Errorf("create song: %w", err)
	}
	song := toSong(row)
	return &song, nil
}

func (s *Service) Update(ctx context.Context, slugStr string, in SongInput) (*Song, error) {
	if err := auth.Require(ctx, apinames.SongUpdate); err != nil {
		return nil, err
	}
	if in.Title == "" || in.Lyrics == "" {
		return nil, invalidf("title and lyrics are required")
	}

	existing, err := s.queries.GetSongBySlug(ctx, db.GetSongBySlugParams{
		Slug:           slugStr,
		IncludeDeleted: dbutil.ToBool(true),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get song: %w", err)
	}

	row, err := s.queries.UpdateSong(ctx, db.UpdateSongParams{
		ID:       existing.ID,
		Title:    s.sanitizer.Sanitize(in.Title),
		Lyrics:   s.sanitizer.Sanitize(in.Lyrics),
		Melody:   dbutil.ToText(sanitizePtr(s.sanitizer, in.Melody)),
		Category: dbutil.ToText(in.Category),
		Video:    dbutil.ToText(in.Video),
	})
	if err != nil {
		return nil, fmt.Errorf("update song: %w", err)
	}
	song := toSong(row)
	return &song, nil
}

func (s *Service) Delete(ctx context.Context, slugStr string) error {
	if err := auth.Require(ctx, apinames.SongDelete); err != nil {
		return err
	}
	existing, err := s.queries.GetSongBySlug(ctx, db.GetSongBySlugParams{
		Slug:           slugStr,
		IncludeDeleted: dbutil.ToBool(true),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get song: %w", err)
	}
	if err := s.queries.SoftDeleteSong(ctx, existing.ID); err != nil {
		return fmt.Errorf("soft delete song: %w", err)
	}
	return nil
}

func (s *Service) Restore(ctx context.Context, slugStr string) error {
	if err := auth.Require(ctx, apinames.SongDelete); err != nil {
		return err
	}
	existing, err := s.queries.GetSongBySlug(ctx, db.GetSongBySlugParams{
		Slug:           slugStr,
		IncludeDeleted: dbutil.ToBool(true),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get song: %w", err)
	}
	if err := s.queries.RestoreSong(ctx, existing.ID); err != nil {
		return fmt.Errorf("restore song: %w", err)
	}
	return nil
}

// Categories returns the raw distinct category list - for the create/edit
// forms' datalist autocomplete (mirrors getExistingCategories). Use
// GroupedCategories for the list page's filter chips, which need the
// grouped id->display-name map instead - two different shapes for two
// different old-app call sites, not a redundant pair.
func (s *Service) Categories(ctx context.Context, includeDeleted bool) ([]string, error) {
	raw, err := s.rawCategories(ctx, includeDeleted)
	if err != nil {
		return nil, err
	}
	return raw, nil
}

// GroupedCategories returns the grouped existing-category map (group id ->
// display name) for the list page's filter chips - see GroupCategories.
func (s *Service) GroupedCategories(
	ctx context.Context,
	includeDeleted bool,
) (map[string]string, error) {
	raw, err := s.rawCategories(ctx, includeDeleted)
	if err != nil {
		return nil, err
	}
	return GroupCategories(raw), nil
}

// rawCategories requires SongRead (see List/Get's doc comment on why reads
// are gated at all) and honors includeDeleted only for a caller holding
// SongDelete, matching List.
func (s *Service) rawCategories(ctx context.Context, includeDeleted bool) ([]string, error) {
	if err := auth.Require(ctx, apinames.SongRead); err != nil {
		return nil, err
	}
	includeDeleted = includeDeleted && canSeeDeleted(ctx)
	rows, err := s.queries.ListDistinctSongCategories(ctx, dbutil.ToBool(includeDeleted))
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	raw := make([]string, 0, len(rows))
	for _, r := range rows {
		if r.Valid {
			raw = append(raw, r.String)
		}
	}
	return raw, nil
}

func (s *Service) Melodies(ctx context.Context, includeDeleted bool) ([]string, error) {
	if err := auth.Require(ctx, apinames.SongRead); err != nil {
		return nil, err
	}
	includeDeleted = includeDeleted && canSeeDeleted(ctx)
	rows, err := s.queries.ListDistinctSongMelodies(ctx, dbutil.ToBool(includeDeleted))
	if err != nil {
		return nil, fmt.Errorf("list melodies: %w", err)
	}
	out := make([]string, 0, len(rows))
	for _, r := range rows {
		if r.Valid {
			out = append(out, r.String)
		}
	}
	return out, nil
}

// uniqueSlug mirrors slugifySongTitle from
// src/routes/(app)/songbook/create/helpers.ts: slugify the title, then
// suffix with a count if that slug prefix is already in use.
func (s *Service) uniqueSlug(ctx context.Context, title string) (string, error) {
	base := slug.Slugify(title)
	count, err := s.queries.CountSongSlugsWithPrefix(ctx, dbutil.ToText(&base))
	if err != nil {
		return "", fmt.Errorf("count slugs: %w", err)
	}
	return slug.SlugWithCount(base, int(count)), nil
}

func sanitizePtr(p *bluemonday.Policy, s *string) *string {
	if s == nil {
		return nil
	}
	sanitized := p.Sanitize(*s)
	return &sanitized
}
