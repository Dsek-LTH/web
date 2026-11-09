package articles

import (
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/comments"
	"github.com/dsek-lth/web/apps/api/internal/db"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
	"github.com/dsek-lth/web/apps/api/internal/integrations"
	"github.com/dsek-lth/web/apps/api/internal/locale"
	"github.com/dsek-lth/web/apps/api/internal/mentions"
	"github.com/dsek-lth/web/apps/api/internal/nollning"
	"github.com/dsek-lth/web/apps/api/internal/sanitize"
	"github.com/dsek-lth/web/apps/api/internal/slug"
)

// ErrNotFound is returned when an article, comment, or tag lookup by
// identifier finds nothing.
var ErrNotFound = errors.New("articles: not found")

// ErrInvalidInput is wrapped into errors caused by malformed caller input
// (e.g. a UUID that doesn't parse), so the API layer can map them to 422
// instead of 500.
var ErrInvalidInput = errors.New("articles: invalid input")

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

const defaultPageSize = 10

type Service struct {
	queries   *db.Queries
	sanitizer *sanitize.Policy
	notifier  integrations.Notifier
	webhooker integrations.Webhooker
	uploader  integrations.Uploader
}

func NewService(
	dbtx db.DBTX,
	notifier integrations.Notifier,
	webhooker integrations.Webhooker,
	uploader integrations.Uploader,
) *Service {
	return &Service{
		queries:   db.New(dbtx),
		sanitizer: sanitize.UGC(),
		notifier:  notifier,
		webhooker: webhooker,
		uploader:  uploader,
	}
}

func (s *Service) List(ctx context.Context, params ListParams) ([]ArticleSummary, int, error) {
	page := params.Page
	if page < 1 {
		page = 1
	}
	pageSize := params.PageSize
	if pageSize < 1 {
		pageSize = defaultPageSize
	}

	tagIDs, err := dbutil.ParseUUIDs(params.TagIDs)
	if err != nil {
		return nil, 0, invalidf("invalid tag id: %v", err)
	}
	committeeID, err := dbutil.ParseUUIDPtr(params.CommitteeID)
	if err != nil {
		return nil, 0, invalidf("invalid committee id: %v", err)
	}
	search := dbutil.TextOrInvalid(params.Search)
	authorStudentID := dbutil.TextOrInvalid(params.AuthorStudentID)
	nollningSeasonID, err := dbutil.ParseUUIDPtr(params.NollningSeasonID)
	if err != nil {
		return nil, 0, invalidf("invalid nollning season id: %v", err)
	}

	staben := nollning.StabenViewFor(ctx)
	var viewerID pgtype.UUID
	if identity, ok := auth.FromContext(ctx); ok && identity.MemberID != "" {
		viewerID, err = dbutil.ParseUUID(identity.MemberID)
		if err != nil {
			return nil, 0, fmt.Errorf("parse caller member id: %w", err)
		}
	}

	rows, err := s.queries.ListArticles(ctx, db.ListArticlesParams{
		Search:           search,
		TagIds:           tagIDs,
		CommitteeID:      committeeID,
		AuthorStudentID:  authorStudentID,
		HideStaben:       staben.Hides(),
		ViewerMemberID:   viewerID,
		NollningSeasonID: nollningSeasonID,
		IncludeNollning:  params.IncludeNollning,
		Limit:            int32(pageSize),
		Offset:           int32((page - 1) * pageSize),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list articles: %w", err)
	}

	total, err := s.queries.CountArticles(ctx, db.CountArticlesParams{
		Search:           search,
		TagIds:           tagIDs,
		CommitteeID:      committeeID,
		AuthorStudentID:  authorStudentID,
		HideStaben:       staben.Hides(),
		ViewerMemberID:   viewerID,
		NollningSeasonID: nollningSeasonID,
		IncludeNollning:  params.IncludeNollning,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count articles: %w", err)
	}

	loc := locale.FromContext(ctx)
	ids := make([]pgtype.UUID, len(rows))
	summaries := make([]ArticleSummary, len(rows))
	for i, row := range rows {
		summaries[i] = toArticleSummary(row, loc, staben)
		ids[i] = row.ID
	}

	tagsByArticle, err := s.tagsByArticle(ctx, ids)
	if err != nil {
		return nil, 0, err
	}
	for i := range summaries {
		summaries[i].Tags = orEmptyTags(tagsByArticle[summaries[i].ID])
	}

	pageCount := int((total + int64(pageSize) - 1) / int64(pageSize))
	return summaries, pageCount, nil
}

// Get returns a published, non-removed article by slug - the public detail
// view.
func (s *Service) Get(ctx context.Context, slug string) (*ArticleDetail, error) {
	row, err := s.queries.GetArticleBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get article: %w", err)
	}
	return s.detail(ctx, db.ListArticlesRow(row))
}

// GetHidden returns an article by slug like Get, but can also return one
// Get hides: a soft-deleted one (includeDeleted) or one that isn't
// published yet (includeUnpublished) - for an author loading their own
// draft or scheduled article (e.g. the edit page). A hidden article is only
// returned to someone who may edit it.
func (s *Service) GetHidden(
	ctx context.Context, slug string, includeDeleted, includeUnpublished bool,
) (*ArticleDetail, error) {
	row, err := s.queries.GetArticleRowBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get article: %w", err)
	}
	// The database's clock, not ours: removed_at is set with its now(), and
	// the public reads filter with it too.
	dbNow, err := s.queries.DatabaseNow(ctx)
	if err != nil {
		return nil, fmt.Errorf("get database time: %w", err)
	}
	now := dbNow.Time
	deleted := row.RemovedAt.Valid && !row.RemovedAt.Time.After(now)
	unpublished := !row.PublishedDatetime.Valid || row.PublishedDatetime.Time.After(now)
	if (deleted && !includeDeleted) || (unpublished && !includeUnpublished) {
		return nil, ErrNotFound
	}
	detail, err := s.detail(ctx, db.ListArticlesRow(row))
	if err != nil {
		return nil, err
	}
	if (deleted || unpublished) && !detail.CanEdit {
		return nil, ErrNotFound
	}
	return detail, nil
}

func (s *Service) Create(ctx context.Context, in ArticleInput) (*ArticleDetail, error) {
	if err := auth.Require(ctx, apinames.NewsArticleCreate); err != nil {
		return nil, err
	}
	identity, _ := auth.FromContext(ctx) // Require above guarantees this is present

	authorID, err := s.resolveAuthor(ctx, identity.MemberID, in.Author)
	if err != nil {
		return nil, err
	}

	committeeID, err := dbutil.ParseUUIDPtr(in.CommitteeID)
	if err != nil {
		return nil, invalidf("invalid committee id: %v", err)
	}

	tagIDs, err := dbutil.ParseUUIDs(in.TagIDs)
	if err != nil {
		return nil, invalidf("invalid tag id: %v", err)
	}

	imageURL := in.ImageURL
	if (imageURL == nil || *imageURL == "") && len(in.ImageURLs) > 0 {
		imageURL = &in.ImageURLs[0]
	}

	nollningSeasonID, err := dbutil.ParseUUIDPtr(in.NollningSeasonID)
	if err != nil {
		return nil, invalidf("invalid nollning season id: %v", err)
	}
	if in.NollningSeasonID != nil {
		if err := auth.Require(ctx, apinames.NollningContentAssociate); err != nil {
			return nil, err
		}
	}

	slug, err := s.uniqueSlug(ctx, in.HeaderSv)
	if err != nil {
		return nil, err
	}

	publishedAt := in.PublishedAt
	if publishedAt == nil {
		now := time.Now()
		publishedAt = &now
	}
	in.PublishedAt = publishedAt

	created, err := s.queries.CreateArticle(ctx, db.CreateArticleParams{
		HeaderSv:               in.HeaderSv,
		HeaderEn:               dbutil.ToText(in.HeaderEn),
		BodySv:                 s.sanitizer.Sanitize(in.BodySv),
		BodyEn:                 dbutil.ToText(s.sanitizer.SanitizePtr(in.BodyEn)),
		ImageUrl:               dbutil.ToText(imageURL),
		ImageUrls:              in.ImageURLs,
		YoutubeUrl:             dbutil.ToText(in.YoutubeURL),
		AuthorID:               authorID,
		PublishedDatetime:      dbutil.ToTimestamptz(publishedAt),
		ShouldSendNotification: pgtype.Bool{Bool: in.ShouldSendNotification, Valid: true},
		NotificationText:       dbutil.ToText(in.NotificationText),
		CommitteeID:            committeeID,
		Slug:                   slug,
		NollningSeasonID:       nollningSeasonID,
	})
	if err != nil {
		return nil, fmt.Errorf("create article: %w", err)
	}

	if err := s.setTags(ctx, created.ID, tagIDs); err != nil {
		return nil, err
	}

	announced, err := s.syncNotifications(
		ctx,
		created.Slug,
		dbutil.UUIDStr(created.ID),
		identity.MemberID,
		dbutil.UUIDStr(authorID),
		in,
		previousState{},
	)
	if err != nil {
		return nil, err
	}

	detail, err := s.getBySlugUnfiltered(ctx, created.Slug)
	if err != nil {
		return nil, err
	}
	detail.AnnouncementFailed = !announced
	return detail, nil
}

// Update replaces every writable field of an article (PUT semantics, not a
// partial patch) and reuses the article's slug. The acting member may
// update any article they authored themselves; anyone else needs
// apinames.NewsArticleUpdate.
func (s *Service) Update(
	ctx context.Context,
	slug string,
	in ArticleInput,
) (*ArticleDetail, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return nil, auth.ErrUnauthenticated
	}

	current, err := s.queries.GetArticleRowBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get article: %w", err)
	}

	isAuthor := identity.MemberID != "" && dbutil.UUIDStr(current.MemberID) == identity.MemberID
	if !isAuthor {
		if err := auth.Require(ctx, apinames.NewsArticleUpdate); err != nil {
			return nil, err
		}
	}

	// Only the author can change the byline. Anyone else editing keeps the
	// article's current author, like the old edit page did - otherwise the
	// editor would take the article over and the author would lose the
	// right to edit it.
	authorID := current.AuthorID
	if isAuthor {
		authorID, err = s.resolveAuthor(ctx, identity.MemberID, in.Author)
		if err != nil {
			return nil, err
		}
	}

	committeeID, err := dbutil.ParseUUIDPtr(in.CommitteeID)
	if err != nil {
		return nil, invalidf("invalid committee id: %v", err)
	}

	tagIDs, err := dbutil.ParseUUIDs(in.TagIDs)
	if err != nil {
		return nil, invalidf("invalid tag id: %v", err)
	}

	imageURL := in.ImageURL
	if (imageURL == nil || *imageURL == "") && len(in.ImageURLs) > 0 {
		imageURL = &in.ImageURLs[0]
	}

	nollningSeasonID, err := dbutil.ParseUUIDPtr(in.NollningSeasonID)
	if err != nil {
		return nil, invalidf("invalid nollning season id: %v", err)
	}
	// Only require the permission when the value is actually changing -
	// resubmitting the article's current nollningSeasonId (every save
	// resubmits every field, since Update is full-replace) doesn't need
	// it, only setting/changing it to something new does.
	if nollningSeasonID != current.NollningSeasonID {
		if err := auth.Require(ctx, apinames.NollningContentAssociate); err != nil {
			return nil, err
		}
	}

	updated, err := s.queries.UpdateArticle(ctx, db.UpdateArticleParams{
		Slug:                   slug,
		HeaderSv:               in.HeaderSv,
		HeaderEn:               dbutil.ToText(in.HeaderEn),
		BodySv:                 s.sanitizer.Sanitize(in.BodySv),
		BodyEn:                 dbutil.ToText(s.sanitizer.SanitizePtr(in.BodyEn)),
		ImageUrl:               dbutil.ToText(imageURL),
		ImageUrls:              in.ImageURLs,
		YoutubeUrl:             dbutil.ToText(in.YoutubeURL),
		AuthorID:               authorID,
		PublishedDatetime:      dbutil.ToTimestamptz(in.PublishedAt),
		ShouldSendNotification: pgtype.Bool{Bool: in.ShouldSendNotification, Valid: true},
		NotificationText:       dbutil.ToText(in.NotificationText),
		CommitteeID:            committeeID,
		NollningSeasonID:       nollningSeasonID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update article: %w", err)
	}

	if err := s.setTags(ctx, updated.ID, tagIDs); err != nil {
		return nil, err
	}

	prev := previousState{publishedAt: dbutil.TimePtr(current.PublishedDatetime)}
	announced, err := s.syncNotifications(
		ctx,
		updated.Slug,
		dbutil.UUIDStr(updated.ID),
		identity.MemberID,
		dbutil.UUIDStr(authorID),
		in,
		prev,
	)
	if err != nil {
		return nil, err
	}

	detail, err := s.getBySlugUnfiltered(ctx, updated.Slug)
	if err != nil {
		return nil, err
	}
	detail.AnnouncementFailed = !announced
	return detail, nil
}

// Delete soft-deletes an article (sets removed_at); it does not remove the
// row.
func (s *Service) Delete(ctx context.Context, slug string) error {
	if err := auth.Require(ctx, apinames.NewsArticleDelete); err != nil {
		return err
	}
	// SoftDeleteArticle's UPDATE silently affects zero rows for an unknown
	// slug, so existence is checked separately to return a proper 404.
	if _, err := s.queries.GetArticleIDBySlug(ctx, slug); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("find article: %w", err)
	}
	if err := s.queries.SoftDeleteArticle(ctx, slug); err != nil {
		return fmt.Errorf("delete article: %w", err)
	}
	return nil
}

func (s *Service) Like(ctx context.Context, slug string) error {
	if err := auth.Require(ctx, apinames.NewsArticleLike); err != nil {
		return err
	}
	identity, _ := auth.FromContext(ctx)

	row, err := s.queries.GetArticleRowBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("find article: %w", err)
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return invalidf("invalid member id: %v", err)
	}

	if err := s.queries.AddArticleLike(ctx, db.AddArticleLikeParams{
		ArticleID: row.ID,
		MemberID:  memberUUID,
	}); err != nil {
		return fmt.Errorf("like article: %w", err)
	}

	if err := s.notifier.NotifyLike(ctx, integrations.LikeNotification{
		ArticleID:             dbutil.UUIDStr(row.ID),
		Slug:                  row.Slug,
		HeaderSv:              row.HeaderSv,
		LikedByMemberID:       identity.MemberID,
		ArticleAuthorMemberID: dbutil.UUIDStr(row.MemberID),
	}); err != nil {
		return fmt.Errorf("notify like: %w", err)
	}
	return nil
}

func (s *Service) Unlike(ctx context.Context, slug string) error {
	if err := auth.Require(ctx, apinames.NewsArticleLike); err != nil {
		return err
	}
	identity, _ := auth.FromContext(ctx)

	articleID, err := s.queries.GetArticleIDBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("find article: %w", err)
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return invalidf("invalid member id: %v", err)
	}

	if err := s.queries.RemoveArticleLike(ctx, db.RemoveArticleLikeParams{
		ArticleID: articleID,
		MemberID:  memberUUID,
	}); err != nil {
		return fmt.Errorf("unlike article: %w", err)
	}
	return nil
}

func (s *Service) AddComment(ctx context.Context, slug, content string) (*Comment, error) {
	if err := auth.Require(ctx, apinames.NewsArticleComment); err != nil {
		return nil, err
	}
	identity, _ := auth.FromContext(ctx)

	articleID, err := s.queries.GetArticleIDBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("find article: %w", err)
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return nil, invalidf("invalid member id: %v", err)
	}

	// Checked after sanitizing too: escaping & and < can push a comment
	// past the column's length, and stripping tags can leave it empty.
	sanitized, err := comments.Normalize(s.sanitizer.Sanitize(content))
	if err != nil {
		return nil, invalidf("%v", err)
	}
	created, err := s.queries.CreateArticleComment(ctx, db.CreateArticleCommentParams{
		ArticleID: articleID,
		MemberID:  memberUUID,
		Content:   pgtype.Text{String: sanitized, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("create comment: %w", err)
	}

	return &Comment{
		ID:        dbutil.UUIDStr(created.ID),
		Content:   &sanitized,
		Published: created.Published.Time,
		Member:    Member{ID: identity.MemberID},
		CanDelete: true,
	}, nil
}

// RemoveComment lets a comment's own author, or anyone holding
// apinames.NewsArticleCommentDelete, delete it - the old ZModel's two
// ArticleComment delete rules (see internal/comments.CanDelete; the author
// half was added in the Phase 12 upstream sync, once upstream's restored
// comment UI (#1390) relied on it).
func (s *Service) RemoveComment(ctx context.Context, slug, commentID string) error {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return auth.ErrUnauthenticated
	}
	articleID, err := s.queries.GetArticleIDBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("find article: %w", err)
	}
	commentUUID, err := dbutil.ParseUUID(commentID)
	if err != nil {
		return invalidf("invalid comment id: %v", err)
	}
	authorID, err := s.queries.GetArticleCommentMemberID(ctx, db.GetArticleCommentMemberIDParams{
		CommentID: commentUUID,
		ArticleID: articleID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("find comment: %w", err)
	}
	if !comments.CanDelete(identity, apinames.NewsArticleCommentDelete, dbutil.UUIDStr(authorID)) {
		return auth.ErrForbidden
	}
	if err := s.queries.DeleteArticleComment(ctx, db.DeleteArticleCommentParams{
		CommentID: commentUUID,
		ArticleID: articleID,
	}); err != nil {
		return fmt.Errorf("delete comment: %w", err)
	}
	return nil
}

func (s *Service) ListTags(ctx context.Context) ([]Tag, error) {
	rows, err := s.queries.ListTags(ctx)
	if err != nil {
		return nil, fmt.Errorf("list tags: %w", err)
	}
	loc := locale.FromContext(ctx)
	tags := make([]Tag, len(rows))
	for i, r := range rows {
		nameEn := dbutil.TextPtr(r.NameEn)
		tags[i] = Tag{
			ID:        dbutil.UUIDStr(r.ID),
			Name:      dbutil.ResolveName(r.NameSv, nameEn, loc),
			NameSv:    r.NameSv,
			NameEn:    nameEn,
			Color:     dbutil.TextPtr(r.Color),
			IsDefault: r.IsDefault.Bool,
		}
	}
	return tags, nil
}

// CreateTag makes a tag. The tag admin page's create form only sends
// nameSv; nameEn and color can be set here or later with UpdateTag.
func (s *Service) CreateTag(ctx context.Context, in TagInput) (*Tag, error) {
	if err := auth.Require(ctx, apinames.TagsCreate); err != nil {
		return nil, err
	}
	in.NameSv = strings.TrimSpace(in.NameSv)
	if in.NameSv == "" {
		return nil, invalidf("tag name is required")
	}
	r, err := s.queries.CreateTag(ctx, in.NameSv)
	if err != nil {
		return nil, fmt.Errorf("create tag: %w", err)
	}
	if in.NameEn == nil && in.Color == nil {
		return toTag(r.ID, r.NameSv, r.NameEn, r.Color, r.IsDefault, locale.FromContext(ctx)), nil
	}
	u, err := s.queries.UpdateTag(ctx, db.UpdateTagParams{
		ID:     r.ID,
		NameSv: in.NameSv,
		NameEn: dbutil.ToText(in.NameEn),
		Color:  dbutil.ToText(in.Color),
	})
	if err != nil {
		return nil, fmt.Errorf("create tag: %w", err)
	}
	return toTag(u.ID, u.NameSv, u.NameEn, u.Color, u.IsDefault, locale.FromContext(ctx)), nil
}

// UpdateTag replaces a tag's names and color.
func (s *Service) UpdateTag(ctx context.Context, id string, in TagInput) (*Tag, error) {
	if err := auth.Require(ctx, apinames.TagsUpdate); err != nil {
		return nil, err
	}
	tagID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid tag id: %v", err)
	}
	in.NameSv = strings.TrimSpace(in.NameSv)
	if in.NameSv == "" {
		return nil, invalidf("tag name is required")
	}
	r, err := s.queries.UpdateTag(ctx, db.UpdateTagParams{
		ID:     tagID,
		NameSv: in.NameSv,
		NameEn: dbutil.ToText(in.NameEn),
		Color:  dbutil.ToText(in.Color),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update tag: %w", err)
	}
	return toTag(r.ID, r.NameSv, r.NameEn, r.Color, r.IsDefault, locale.FromContext(ctx)), nil
}

func toTag(
	id pgtype.UUID, nameSv string, nameEnT, color pgtype.Text, isDefault pgtype.Bool, loc string,
) *Tag {
	nameEn := dbutil.TextPtr(nameEnT)
	return &Tag{
		ID:        dbutil.UUIDStr(id),
		Name:      dbutil.ResolveName(nameSv, nameEn, loc),
		NameSv:    nameSv,
		NameEn:    nameEn,
		Color:     dbutil.TextPtr(color),
		IsDefault: isDefault.Bool,
	}
}

// ListActiveMandatesForMember lists a member's currently-active mandates
// (see ListActiveMandatesForMember's SQL doc comment for "active") - used
// for the "post as" author picker. Staben mandates are left out for callers
// who may not see staben (nollning.StabenView), unless they're the member's.
func (s *Service) ListActiveMandatesForMember(
	ctx context.Context,
	studentID string,
) ([]Mandate, error) {
	rows, err := s.queries.ListActiveMandatesForMember(ctx, dbutil.ToText(&studentID))
	if err != nil {
		return nil, fmt.Errorf("list mandates: %w", err)
	}
	loc := locale.FromContext(ctx)
	staben := nollning.StabenViewFor(ctx)
	mandates := make([]Mandate, 0, len(rows))
	for _, r := range rows {
		if staben.HidesMandate(r.PositionID, dbutil.UUIDStr(r.MemberID)) {
			continue
		}
		nameEn := dbutil.TextPtr(r.PositionNameEn)
		mandates = append(mandates, Mandate{
			ID: dbutil.UUIDStr(r.ID),
			Position: &Position{
				ID:     r.PositionID,
				Name:   dbutil.ResolveName(r.PositionNameSv, nameEn, loc),
				NameSv: r.PositionNameSv,
				NameEn: nameEn,
			},
		})
	}
	return mandates, nil
}

// ListCustomAuthors lists every custom byline (e.g. "Styrelsen"), for the
// "post as" author picker. Unfiltered - see ListCustomAuthors's SQL doc
// comment for why every member currently sees every custom author.
func (s *Service) ListCustomAuthors(ctx context.Context) ([]CustomAuthor, error) {
	rows, err := s.queries.ListCustomAuthors(ctx)
	if err != nil {
		return nil, fmt.Errorf("list custom authors: %w", err)
	}
	loc := locale.FromContext(ctx)
	customAuthors := make([]CustomAuthor, len(rows))
	for i, r := range rows {
		nameEn := dbutil.TextPtr(r.NameEn)
		customAuthors[i] = CustomAuthor{
			ID:       dbutil.UUIDStr(r.ID),
			Name:     dbutil.ResolveName(r.NameSv, nameEn, loc),
			NameSv:   r.NameSv,
			NameEn:   nameEn,
			ImageURL: dbutil.TextPtr(r.ImageUrl),
		}
	}
	return customAuthors, nil
}

// UploadImage stores an image for an article or an event and returns its
// URL. Anyone who may write either can upload: the event form uses it for
// header images, and someone who may create events but not articles must
// still be able to save an event with an image.
func (s *Service) UploadImage(
	ctx context.Context,
	filename string,
	data io.Reader,
) (string, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return "", auth.ErrUnauthenticated
	}
	if !identity.Has(apinames.NewsArticleCreate) && !identity.Has(apinames.EventCreate) &&
		!identity.Has(apinames.EventUpdate) {
		return "", auth.ErrForbidden
	}
	url, err := s.uploader.Upload(ctx, filename, data)
	if err != nil {
		return "", fmt.Errorf("upload image: %w", err)
	}
	return url, nil
}

// resolveAuthor finds the existing (member, mandate, custom) author triple
// for the acting member or creates one - authors are reused across
// articles. memberID is always the authenticated acting member, never
// client input (see Create/Update). If in.MandateID is set, it's verified
// to actually belong to memberID - custom_authors has no owner concept in
// the schema (shared personas like "Styrelsen"), so there's nothing to
// verify for in.CustomID.
func (s *Service) resolveAuthor(
	ctx context.Context,
	memberID string,
	in AuthorInput,
) (pgtype.UUID, error) {
	memberUUID, err := dbutil.ParseUUID(memberID)
	if err != nil {
		return pgtype.UUID{}, invalidf("invalid member id: %v", err)
	}
	mandateID, err := dbutil.ParseUUIDPtr(in.MandateID)
	if err != nil {
		return pgtype.UUID{}, invalidf("invalid mandate id: %v", err)
	}
	customID, err := dbutil.ParseUUIDPtr(in.CustomID)
	if err != nil {
		return pgtype.UUID{}, invalidf("invalid custom author id: %v", err)
	}

	if mandateID.Valid {
		owner, err := s.queries.GetMandateMemberID(ctx, mandateID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return pgtype.UUID{}, invalidf("mandate not found")
			}
			return pgtype.UUID{}, fmt.Errorf("check mandate ownership: %w", err)
		}
		if dbutil.UUIDStr(owner) != memberID {
			return pgtype.UUID{}, auth.ErrForbidden
		}
	}

	existing, err := s.queries.FindAuthor(ctx, db.FindAuthorParams{
		MemberID:  memberUUID,
		MandateID: mandateID,
		CustomID:  customID,
	})
	if err == nil {
		return existing, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return pgtype.UUID{}, fmt.Errorf("find author: %w", err)
	}

	created, err := s.queries.CreateAuthor(ctx, db.CreateAuthorParams{
		MemberID:  memberUUID,
		MandateID: mandateID,
		CustomID:  customID,
	})
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("create author: %w", err)
	}
	return created, nil
}

func (s *Service) setTags(ctx context.Context, articleID pgtype.UUID, tagIDs []pgtype.UUID) error {
	if err := s.queries.ClearArticleTags(ctx, articleID); err != nil {
		return fmt.Errorf("clear tags: %w", err)
	}
	if len(tagIDs) == 0 {
		return nil
	}
	if err := s.queries.AddArticleTags(ctx, db.AddArticleTagsParams{
		ArticleID: articleID,
		TagIds:    tagIDs,
	}); err != nil {
		return fmt.Errorf("set tags: %w", err)
	}
	return nil
}

// uniqueSlug mirrors slugify + slugWithCount from the TS backend: slugify
// the header, then suffix with a count if that slug prefix is already in
// use.
func (s *Service) uniqueSlug(ctx context.Context, headerSv string) (string, error) {
	base := slug.Slugify(headerSv)
	count, err := s.queries.CountArticleSlugsWithPrefix(ctx, pgtype.Text{String: base, Valid: true})
	if err != nil {
		return "", fmt.Errorf("count slugs: %w", err)
	}
	return slug.SlugWithCount(base, int(count)), nil
}

func (s *Service) getBySlugUnfiltered(ctx context.Context, slug string) (*ArticleDetail, error) {
	row, err := s.queries.GetArticleRowBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get article: %w", err)
	}
	return s.detail(ctx, db.ListArticlesRow(row))
}

func (s *Service) detail(ctx context.Context, row db.ListArticlesRow) (*ArticleDetail, error) {
	summary := toArticleSummary(row, locale.FromContext(ctx), nollning.StabenViewFor(ctx))

	tagsByArticle, err := s.tagsByArticle(ctx, []pgtype.UUID{row.ID})
	if err != nil {
		return nil, err
	}
	summary.Tags = orEmptyTags(tagsByArticle[summary.ID])

	commentRows, err := s.queries.ListArticleComments(ctx, row.ID)
	if err != nil {
		return nil, fmt.Errorf("list comments: %w", err)
	}
	identity, _ := auth.FromContext(ctx)
	articleComments := make([]Comment, len(commentRows))
	for i, c := range commentRows {
		articleComments[i] = Comment{
			CanDelete: comments.CanDelete(
				identity, apinames.NewsArticleCommentDelete, dbutil.UUIDStr(c.MemberID),
			),
			ID:        dbutil.UUIDStr(c.ID),
			Content:   dbutil.TextPtr(c.Content),
			Published: c.Published.Time,
			Member: Member{
				ID:          dbutil.UUIDStr(c.MemberID),
				StudentID:   dbutil.TextPtr(c.MemberStudentID),
				FirstName:   dbutil.TextPtr(c.MemberFirstName),
				LastName:    dbutil.TextPtr(c.MemberLastName),
				Nickname:    dbutil.TextPtr(c.MemberNickname),
				PicturePath: dbutil.TextPtr(c.MemberPicturePath),
			},
		}
	}

	contents := make([]string, len(articleComments))
	for i, c := range articleComments {
		contents[i] = dbutil.StringOr(c.Content, "")
	}
	taggedMembers, err := mentions.Resolve(ctx, s.queries, contents)
	if err != nil {
		return nil, err
	}

	likerRows, err := s.queries.ListArticleLikers(ctx, row.ID)
	if err != nil {
		return nil, fmt.Errorf("list likers: %w", err)
	}
	likers := make([]Member, len(likerRows))
	for i, m := range likerRows {
		likers[i] = Member{
			ID:          dbutil.UUIDStr(m.ID),
			StudentID:   dbutil.TextPtr(m.StudentID),
			FirstName:   dbutil.TextPtr(m.FirstName),
			LastName:    dbutil.TextPtr(m.LastName),
			Nickname:    dbutil.TextPtr(m.Nickname),
			PicturePath: dbutil.TextPtr(m.PicturePath),
		}
	}

	canEdit, canDelete := false, false
	if identity != nil {
		// Mirrors Update's author-or-policy bypass and Delete's
		// policy-only check exactly (see those methods) - one
		// implementation of "can this identity touch this article",
		// read here instead of duplicated.
		canEdit = (identity.MemberID != "" && dbutil.UUIDStr(row.MemberID) == identity.MemberID) ||
			identity.Has(apinames.NewsArticleUpdate)
		canDelete = identity.Has(apinames.NewsArticleDelete)
	}

	return &ArticleDetail{
		ArticleSummary: summary,
		Comments:       articleComments,
		TaggedMembers:  taggedMembers,
		Likers:         likers,
		CanEdit:        canEdit,
		CanDelete:      canDelete,
	}, nil
}

func (s *Service) tagsByArticle(ctx context.Context, ids []pgtype.UUID) (map[string][]Tag, error) {
	result := make(map[string][]Tag, len(ids))
	if len(ids) == 0 {
		return result, nil
	}
	rows, err := s.queries.ListTagsForArticles(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("list article tags: %w", err)
	}
	loc := locale.FromContext(ctx)
	for _, r := range rows {
		articleID := dbutil.UUIDStr(r.ArticleID)
		nameEn := dbutil.TextPtr(r.NameEn)
		result[articleID] = append(result[articleID], Tag{
			ID:        dbutil.UUIDStr(r.ID),
			Name:      dbutil.ResolveName(r.NameSv, nameEn, loc),
			NameSv:    r.NameSv,
			NameEn:    nameEn,
			Color:     dbutil.TextPtr(r.Color),
			IsDefault: r.IsDefault.Bool,
		})
	}
	return result, nil
}

// orEmptyTags normalizes a nil tags slice (an article with no tags never
// gets a map entry in tagsByArticle) to an empty one, so the JSON response
// has "tags": [] rather than "tags": null.
func orEmptyTags(tags []Tag) []Tag {
	if tags == nil {
		return []Tag{}
	}
	return tags
}
