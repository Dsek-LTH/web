package songs

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/db"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
)

// The printed songbook (upstream #1283): which song is on which page and
// number. Every song lives in the archive (/songarchive, the rest of this
// package); an entry just places one of them in the book. Reads and writes
// use the same song:* policies as the archive itself.

var (
	// ErrPositionTaken is a create/update onto a page and number another
	// entry already has.
	ErrPositionTaken = errors.New("songs: songbook position already taken")
	// ErrAlreadyInSongBook is a create/update for a song that already has
	// an entry elsewhere in the book.
	ErrAlreadyInSongBook = errors.New("songs: song already in songbook")
)

// SongBookEntry is a song's place in the printed songbook.
type SongBookEntry struct {
	Page         int  `json:"page"         doc:"Page in the printed songbook."`
	NumberOnPage int  `json:"numberOnPage" doc:"The song's number on that page, from 1."`
	Song         Song `json:"song"`
}

// SongBookEntryList is one page of songbook entries.
type SongBookEntryList struct {
	Entries   []SongBookEntry `json:"entries"`
	PageCount int             `json:"pageCount" doc:"Number of pages at this pageSize."`
}

type SongBookEntryInput struct {
	SongID       string `json:"songId"       doc:"A song can be in the songbook once."`
	Page         int    `json:"page"         doc:"Page in the printed songbook."`
	NumberOnPage int    `json:"numberOnPage" doc:"The song's number on that page, from 1."`
}

type SongBookListParams struct {
	// Search is a page number if it parses as a positive integer, a title
	// search otherwise - same rule as upstream's songbook list.
	Search   string
	Page     int
	PageSize int
}

func (s *Service) ListSongBook(
	ctx context.Context, params SongBookListParams,
) ([]SongBookEntry, int, error) {
	if err := auth.Require(ctx, apinames.SongRead); err != nil {
		return nil, 0, err
	}
	page := max(params.Page, 1)
	pageSize := params.PageSize
	if pageSize < 1 {
		pageSize = defaultPageSize
	}

	var pageSearch pgtype.Int4
	var titleSearch pgtype.Text
	search := strings.TrimSpace(params.Search)
	if n, err := strconv.ParseInt(search, 10, 32); err == nil && n > 0 {
		pageSearch = pgtype.Int4{Int32: int32(n), Valid: true}
	} else if search != "" {
		titleSearch = pgtype.Text{String: dbutil.EscapeLike(search), Valid: true}
	}
	showDeleted := canSeeDeleted(ctx)

	rows, err := s.queries.ListSongBookEntries(ctx, db.ListSongBookEntriesParams{
		ShowDeleted: showDeleted,
		PageSearch:  pageSearch,
		TitleSearch: titleSearch,
		RowLimit:    int32(pageSize),
		RowOffset:   int32((page - 1) * pageSize),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list songbook: %w", err)
	}
	total, err := s.queries.CountSongBookEntries(ctx, db.CountSongBookEntriesParams{
		ShowDeleted: showDeleted,
		PageSearch:  pageSearch,
		TitleSearch: titleSearch,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count songbook: %w", err)
	}

	entries := make([]SongBookEntry, len(rows))
	for i, r := range rows {
		entries[i] = SongBookEntry{
			Page:         int(r.Page),
			NumberOnPage: int(r.NumberOnPage),
			Song: toSong(db.Song{
				ID: r.ID, Title: r.Title, Lyrics: r.Lyrics, Melody: r.Melody,
				Category: r.Category, CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt,
				DeletedAt: r.DeletedAt, Slug: r.Slug, Video: r.Video,
			}),
		}
	}
	pageCount := int((total + int64(pageSize) - 1) / int64(pageSize))
	return entries, pageCount, nil
}

func (s *Service) GetSongBookEntry(
	ctx context.Context, page, number int,
) (*SongBookEntry, error) {
	if err := auth.Require(ctx, apinames.SongRead); err != nil {
		return nil, err
	}
	return s.songBookEntry(ctx, page, number)
}

// songBookEntry is GetSongBookEntry without the song:read check, for
// returning an entry the caller just wrote.
func (s *Service) songBookEntry(ctx context.Context, page, number int) (*SongBookEntry, error) {
	r, err := s.queries.GetSongBookEntry(ctx, db.GetSongBookEntryParams{
		Page:         int32(page),
		NumberOnPage: int32(number),
		ShowDeleted:  canSeeDeleted(ctx),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get songbook entry: %w", err)
	}
	return &SongBookEntry{
		Page:         int(r.Page),
		NumberOnPage: int(r.NumberOnPage),
		Song: toSong(db.Song{
			ID: r.ID, Title: r.Title, Lyrics: r.Lyrics, Melody: r.Melody,
			Category: r.Category, CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt,
			DeletedAt: r.DeletedAt, Slug: r.Slug, Video: r.Video,
		}),
	}, nil
}

func (s *Service) CreateSongBookEntry(
	ctx context.Context, in SongBookEntryInput,
) (*SongBookEntry, error) {
	if err := auth.Require(ctx, apinames.SongCreate); err != nil {
		return nil, err
	}
	songID, err := s.validateEntry(ctx, in, nil)
	if err != nil {
		return nil, err
	}
	if err := s.queries.CreateSongBookEntry(ctx, db.CreateSongBookEntryParams{
		SongID:       songID,
		Page:         int32(in.Page),
		NumberOnPage: int32(in.NumberOnPage),
	}); err != nil {
		return nil, fmt.Errorf("create songbook entry: %w", err)
	}
	return s.songBookEntry(ctx, in.Page, in.NumberOnPage)
}

// UpdateSongBookEntry moves the entry at (page, number) to in's position
// and/or points it at another song.
func (s *Service) UpdateSongBookEntry(
	ctx context.Context, page, number int, in SongBookEntryInput,
) (*SongBookEntry, error) {
	if err := auth.Require(ctx, apinames.SongUpdate); err != nil {
		return nil, err
	}
	songID, err := s.validateEntry(ctx, in, &[2]int{page, number})
	if err != nil {
		return nil, err
	}
	n, err := s.queries.UpdateSongBookEntry(ctx, db.UpdateSongBookEntryParams{
		SongID:       songID,
		Page:         int32(in.Page),
		NumberOnPage: int32(in.NumberOnPage),
		OldPage:      int32(page),
		OldNumber:    int32(number),
	})
	if err != nil {
		return nil, fmt.Errorf("update songbook entry: %w", err)
	}
	if n == 0 {
		return nil, ErrNotFound
	}
	return s.songBookEntry(ctx, in.Page, in.NumberOnPage)
}

func (s *Service) DeleteSongBookEntry(ctx context.Context, page, number int) error {
	if err := auth.Require(ctx, apinames.SongDelete); err != nil {
		return err
	}
	n, err := s.queries.DeleteSongBookEntry(ctx, db.DeleteSongBookEntryParams{
		Page:         int32(page),
		NumberOnPage: int32(number),
	})
	if err != nil {
		return fmt.Errorf("delete songbook entry: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// validateEntry checks in's position and song, ignoring the entry at
// except (the one being edited, nil for a create), and returns the song id.
func (s *Service) validateEntry(
	ctx context.Context, in SongBookEntryInput, except *[2]int,
) (pgtype.UUID, error) {
	if in.Page < 1 || in.NumberOnPage < 1 {
		return pgtype.UUID{}, invalidf("page and numberOnPage must be positive")
	}
	songID, err := dbutil.ParseUUID(in.SongID)
	if err != nil {
		return pgtype.UUID{}, invalidf("invalid song id: %v", err)
	}
	exists, err := s.queries.SongExists(ctx, songID)
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("look up song: %w", err)
	}
	if !exists {
		return pgtype.UUID{}, invalidf("no such song")
	}

	var exceptPage, exceptNumber pgtype.Int4
	if except != nil {
		exceptPage = pgtype.Int4{Int32: int32(except[0]), Valid: true}
		exceptNumber = pgtype.Int4{Int32: int32(except[1]), Valid: true}
	}
	taken, err := s.queries.SongBookPositionTaken(ctx, db.SongBookPositionTakenParams{
		Page:         int32(in.Page),
		NumberOnPage: int32(in.NumberOnPage),
		ExceptPage:   exceptPage,
		ExceptNumber: exceptNumber,
	})
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("check songbook position: %w", err)
	}
	if taken {
		return pgtype.UUID{}, ErrPositionTaken
	}
	inBook, err := s.queries.SongInSongBook(ctx, db.SongInSongBookParams{
		SongID:       songID,
		ExceptPage:   exceptPage,
		ExceptNumber: exceptNumber,
	})
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("check song in songbook: %w", err)
	}
	if inBook {
		return pgtype.UUID{}, ErrAlreadyInSongBook
	}
	return songID, nil
}
