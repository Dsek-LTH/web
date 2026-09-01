package articles

import (
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/microcosm-cc/bluemonday"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/integrations"
	"github.com/dsek-lth/web/backend/internal/locale"
)

// ErrNotFound is returned when an article, comment, or tag lookup by
// identifier finds nothing.
var ErrNotFound = errors.New("articles: not found")

// ErrInvalidInput is wrapped into errors caused by malformed caller input
// (e.g. a UUID that doesn't parse), so the API layer can map them to 400
// instead of 500.
var ErrInvalidInput = errors.New("articles: invalid input")

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

const defaultPageSize = 10

type Service struct {
	queries   *db.Queries
	sanitizer *bluemonday.Policy
	scheduler integrations.Scheduler
	notifier  integrations.Notifier
	webhooker integrations.Webhooker
	uploader  integrations.Uploader
}

func NewService(
	dbtx db.DBTX,
	scheduler integrations.Scheduler,
	notifier integrations.Notifier,
	webhooker integrations.Webhooker,
	uploader integrations.Uploader,
) *Service {
	return &Service{
		queries:   db.New(dbtx),
		sanitizer: bluemonday.UGCPolicy(),
		scheduler: scheduler,
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

	tagIDs, err := parseUUIDs(params.TagIDs)
	if err != nil {
		return nil, 0, invalidf("invalid tag id: %v", err)
	}
	committeeID, err := parseUUIDPtr(params.CommitteeID)
	if err != nil {
		return nil, 0, invalidf("invalid committee id: %v", err)
	}
	search := textOrInvalid(params.Search)
	authorStudentID := textOrInvalid(params.AuthorStudentID)

	rows, err := s.queries.ListArticles(ctx, db.ListArticlesParams{
		Search:          search,
		TagIds:          tagIDs,
		CommitteeID:     committeeID,
		AuthorStudentID: authorStudentID,
		Limit:           int32(pageSize),
		Offset:          int32((page - 1) * pageSize),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list articles: %w", err)
	}

	total, err := s.queries.CountArticles(ctx, db.CountArticlesParams{
		Search:          search,
		TagIds:          tagIDs,
		CommitteeID:     committeeID,
		AuthorStudentID: authorStudentID,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count articles: %w", err)
	}

	loc := locale.FromContext(ctx)
	ids := make([]pgtype.UUID, len(rows))
	summaries := make([]ArticleSummary, len(rows))
	for i, row := range rows {
		summaries[i] = toArticleSummary(row, loc)
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

// GetAny returns an article by slug regardless of publish/removed status -
// for an author loading their own draft or scheduled article before it's
// public (e.g. the edit page).
func (s *Service) GetAny(ctx context.Context, slug string) (*ArticleDetail, error) {
	return s.getBySlugUnfiltered(ctx, slug)
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

	committeeID, err := parseUUIDPtr(in.CommitteeID)
	if err != nil {
		return nil, invalidf("invalid committee id: %v", err)
	}

	tagIDs, err := parseUUIDs(in.TagIDs)
	if err != nil {
		return nil, invalidf("invalid tag id: %v", err)
	}

	imageURL := in.ImageURL
	if (imageURL == nil || *imageURL == "") && len(in.ImageURLs) > 0 {
		imageURL = &in.ImageURLs[0]
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
		HeaderEn:               toText(in.HeaderEn),
		BodySv:                 s.sanitizer.Sanitize(in.BodySv),
		BodyEn:                 toText(sanitizePtr(s.sanitizer, in.BodyEn)),
		ImageUrl:               toText(imageURL),
		ImageUrls:              in.ImageURLs,
		YoutubeUrl:             toText(in.YoutubeURL),
		AuthorID:               authorID,
		PublishedDatetime:      toTimestamptz(publishedAt),
		ShouldSendNotification: pgtype.Bool{Bool: in.ShouldSendNotification, Valid: true},
		NotificationText:       toText(in.NotificationText),
		CommitteeID:            committeeID,
		Slug:                   slug,
	})
	if err != nil {
		return nil, fmt.Errorf("create article: %w", err)
	}

	if err := s.setTags(ctx, created.ID, tagIDs); err != nil {
		return nil, err
	}

	if err := s.syncNotifications(
		ctx,
		created.Slug,
		uuidStr(created.ID),
		identity.MemberID,
		in,
		nil,
	); err != nil {
		return nil, err
	}

	return s.getBySlugUnfiltered(ctx, created.Slug)
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

	if uuidStr(current.MemberID) != identity.MemberID {
		if err := auth.Require(ctx, apinames.NewsArticleUpdate); err != nil {
			return nil, err
		}
	}

	authorID, err := s.resolveAuthor(ctx, identity.MemberID, in.Author)
	if err != nil {
		return nil, err
	}

	committeeID, err := parseUUIDPtr(in.CommitteeID)
	if err != nil {
		return nil, invalidf("invalid committee id: %v", err)
	}

	tagIDs, err := parseUUIDs(in.TagIDs)
	if err != nil {
		return nil, invalidf("invalid tag id: %v", err)
	}

	imageURL := in.ImageURL
	if (imageURL == nil || *imageURL == "") && len(in.ImageURLs) > 0 {
		imageURL = &in.ImageURLs[0]
	}

	updated, err := s.queries.UpdateArticle(ctx, db.UpdateArticleParams{
		Slug:                   slug,
		HeaderSv:               in.HeaderSv,
		HeaderEn:               toText(in.HeaderEn),
		BodySv:                 s.sanitizer.Sanitize(in.BodySv),
		BodyEn:                 toText(sanitizePtr(s.sanitizer, in.BodyEn)),
		ImageUrl:               toText(imageURL),
		ImageUrls:              in.ImageURLs,
		YoutubeUrl:             toText(in.YoutubeURL),
		AuthorID:               authorID,
		PublishedDatetime:      toTimestamptz(in.PublishedAt),
		ShouldSendNotification: pgtype.Bool{Bool: in.ShouldSendNotification, Valid: true},
		NotificationText:       toText(in.NotificationText),
		CommitteeID:            committeeID,
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

	var prevScheduledID *string
	if current.ScheduledID.Valid {
		prevScheduledID = &current.ScheduledID.String
	}
	if err := s.syncNotifications(
		ctx,
		updated.Slug,
		uuidStr(updated.ID),
		identity.MemberID,
		in,
		prevScheduledID,
	); err != nil {
		return nil, err
	}

	return s.getBySlugUnfiltered(ctx, updated.Slug)
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

// SetScheduledID records the caller's external scheduler task id for a
// future-dated publish. It's a targeted single-field write rather than
// going through Update, since the caller (having just scheduled the
// publish asynchronously) shouldn't need to resend the whole article to
// record this.
func (s *Service) SetScheduledID(ctx context.Context, slug string, scheduledID string) error {
	if _, err := s.queries.GetArticleIDBySlug(ctx, slug); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("find article: %w", err)
	}
	if err := s.queries.SetArticleScheduledID(ctx, db.SetArticleScheduledIDParams{
		Slug:        slug,
		ScheduledID: pgtype.Text{String: scheduledID, Valid: true},
	}); err != nil {
		return fmt.Errorf("set scheduled id: %w", err)
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
	memberUUID, err := parseUUID(identity.MemberID)
	if err != nil {
		return invalidf("invalid member id: %v", err)
	}

	if err := s.queries.AddArticleLike(ctx, db.AddArticleLikeParams{
		ArticleID: row.ID,
		MemberID:  memberUUID,
	}); err != nil {
		return fmt.Errorf("like article: %w", err)
	}

	if err := s.notifier.NotifyLike(
		ctx,
		uuidStr(row.ID),
		identity.MemberID,
		uuidStr(row.MemberID),
	); err != nil {
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
	memberUUID, err := parseUUID(identity.MemberID)
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
	memberUUID, err := parseUUID(identity.MemberID)
	if err != nil {
		return nil, invalidf("invalid member id: %v", err)
	}

	sanitized := s.sanitizer.Sanitize(content)
	created, err := s.queries.CreateArticleComment(ctx, db.CreateArticleCommentParams{
		ArticleID: articleID,
		MemberID:  memberUUID,
		Content:   pgtype.Text{String: sanitized, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("create comment: %w", err)
	}

	return &Comment{
		ID:        uuidStr(created.ID),
		Content:   &sanitized,
		Published: created.Published.Time,
		Member:    Member{ID: identity.MemberID},
	}, nil
}

func (s *Service) RemoveComment(ctx context.Context, slug, commentID string) error {
	if err := auth.Require(ctx, apinames.NewsArticleCommentDelete); err != nil {
		return err
	}
	articleID, err := s.queries.GetArticleIDBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("find article: %w", err)
	}
	commentUUID, err := parseUUID(commentID)
	if err != nil {
		return invalidf("invalid comment id: %v", err)
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
		nameEn := textPtr(r.NameEn)
		tags[i] = Tag{
			ID:        uuidStr(r.ID),
			Name:      resolveName(r.NameSv, nameEn, loc),
			NameSv:    r.NameSv,
			NameEn:    nameEn,
			Color:     textPtr(r.Color),
			IsDefault: r.IsDefault.Bool,
		}
	}
	return tags, nil
}

// ListCommittees lists committees, optionally filtered to one by shortName
// (e.g. for the committee-news page resolving a URL slug to a committee).
func (s *Service) ListCommittees(ctx context.Context, shortName *string) ([]Committee, error) {
	rows, err := s.queries.ListCommittees(ctx, textOrInvalid(shortName))
	if err != nil {
		return nil, fmt.Errorf("list committees: %w", err)
	}
	loc := locale.FromContext(ctx)
	committees := make([]Committee, len(rows))
	for i, r := range rows {
		nameEn := textPtr(r.NameEn)
		committees[i] = Committee{
			ID:        uuidStr(r.ID),
			Name:      resolveName(r.NameSv, nameEn, loc),
			NameSv:    r.NameSv,
			NameEn:    nameEn,
			ShortName: textPtr(r.ShortName),
			SymbolURL: textPtr(r.SymbolUrl),
		}
	}
	return committees, nil
}

// ListActiveMandatesForMember lists a member's currently-active mandates
// (see ListActiveMandatesForMember's SQL doc comment for "active") - used
// for the "post as" author picker.
func (s *Service) ListActiveMandatesForMember(
	ctx context.Context,
	memberID string,
) ([]Mandate, error) {
	memberUUID, err := parseUUID(memberID)
	if err != nil {
		return nil, invalidf("invalid member id: %v", err)
	}
	rows, err := s.queries.ListActiveMandatesForMember(ctx, memberUUID)
	if err != nil {
		return nil, fmt.Errorf("list mandates: %w", err)
	}
	loc := locale.FromContext(ctx)
	mandates := make([]Mandate, len(rows))
	for i, r := range rows {
		nameEn := textPtr(r.PositionNameEn)
		mandates[i] = Mandate{
			ID: uuidStr(r.ID),
			Position: Position{
				ID:     r.PositionID,
				Name:   resolveName(r.PositionNameSv, nameEn, loc),
				NameSv: r.PositionNameSv,
				NameEn: nameEn,
			},
		}
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
		nameEn := textPtr(r.NameEn)
		customAuthors[i] = CustomAuthor{
			ID:       uuidStr(r.ID),
			Name:     resolveName(r.NameSv, nameEn, loc),
			NameSv:   r.NameSv,
			NameEn:   nameEn,
			ImageURL: textPtr(r.ImageUrl),
		}
	}
	return customAuthors, nil
}

// UploadImage stores an article image via the (currently mocked) Uploader
// and returns its URL. Gated on NewsArticleCreate since today the only
// caller is the create/edit flow - revisit if uploads grow other uses.
func (s *Service) UploadImage(
	ctx context.Context,
	filename string,
	data io.Reader,
) (string, error) {
	if err := auth.Require(ctx, apinames.NewsArticleCreate); err != nil {
		return "", err
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
	memberUUID, err := parseUUID(memberID)
	if err != nil {
		return pgtype.UUID{}, invalidf("invalid member id: %v", err)
	}
	mandateID, err := parseUUIDPtr(in.MandateID)
	if err != nil {
		return pgtype.UUID{}, invalidf("invalid mandate id: %v", err)
	}
	customID, err := parseUUIDPtr(in.CustomID)
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
		if uuidStr(owner) != memberID {
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

// syncNotifications applies a create/update request's notification intent
// via the (mocked) scheduler/notifier/webhooker: if the article publishes
// in the future and notifications are wanted, it (re)schedules; if
// previously scheduled but no longer wanted, it cancels; otherwise, if
// notifications are wanted and the article is publishing now, it notifies
// immediately. prevScheduledID is nil for a newly-created article.
func (s *Service) syncNotifications(
	ctx context.Context,
	slug, articleID, authorMemberID string,
	in ArticleInput,
	prevScheduledID *string,
) error {
	notification := integrations.ArticleNotification{
		ArticleID:      articleID,
		Slug:           slug,
		HeaderSv:       in.HeaderSv,
		BodySv:         in.BodySv,
		AuthorMemberID: authorMemberID,
		TagIDs:         in.TagIDs,
	}
	if in.NotificationText != nil {
		notification.NotificationText = *in.NotificationText
	}

	publishesInFuture := in.PublishedAt != nil && in.PublishedAt.After(time.Now())

	switch {
	case publishesInFuture && in.ShouldSendNotification:
		if prevScheduledID != nil {
			if err := s.scheduler.Cancel(ctx, *prevScheduledID); err != nil {
				return fmt.Errorf("cancel previous schedule: %w", err)
			}
		}
		scheduledID, err := s.scheduler.Schedule(ctx, notification, *in.PublishedAt)
		if err != nil {
			return fmt.Errorf("schedule notification: %w", err)
		}
		if err := s.SetScheduledID(ctx, slug, scheduledID); err != nil {
			return err
		}
	case prevScheduledID != nil:
		if err := s.scheduler.Cancel(ctx, *prevScheduledID); err != nil {
			return fmt.Errorf("cancel schedule: %w", err)
		}
		if err := s.queries.SetArticleScheduledID(ctx, db.SetArticleScheduledIDParams{
			Slug:        slug,
			ScheduledID: pgtype.Text{}, // clear it - nothing is scheduled anymore
		}); err != nil {
			return fmt.Errorf("clear scheduled id: %w", err)
		}
	case in.ShouldSendNotification:
		if err := s.notifier.NotifyNewArticle(ctx, notification); err != nil {
			return fmt.Errorf("send notification: %w", err)
		}
		if err := s.webhooker.NotifyNewArticle(ctx, notification); err != nil {
			return fmt.Errorf("send webhook: %w", err)
		}
	}
	return nil
}

// uniqueSlug mirrors slugify + slugWithCount from the TS backend: slugify
// the header, then suffix with a count if that slug prefix is already in
// use.
func (s *Service) uniqueSlug(ctx context.Context, headerSv string) (string, error) {
	base := Slugify(headerSv)
	count, err := s.queries.CountArticleSlugsWithPrefix(ctx, pgtype.Text{String: base, Valid: true})
	if err != nil {
		return "", fmt.Errorf("count slugs: %w", err)
	}
	return SlugWithCount(base, int(count)), nil
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
	summary := toArticleSummary(row, locale.FromContext(ctx))

	tagsByArticle, err := s.tagsByArticle(ctx, []pgtype.UUID{row.ID})
	if err != nil {
		return nil, err
	}
	summary.Tags = orEmptyTags(tagsByArticle[summary.ID])

	commentRows, err := s.queries.ListArticleComments(ctx, row.ID)
	if err != nil {
		return nil, fmt.Errorf("list comments: %w", err)
	}
	comments := make([]Comment, len(commentRows))
	for i, c := range commentRows {
		comments[i] = Comment{
			ID:        uuidStr(c.ID),
			Content:   textPtr(c.Content),
			Published: c.Published.Time,
			Member: Member{
				ID:          uuidStr(c.MemberID),
				StudentID:   textPtr(c.MemberStudentID),
				FirstName:   textPtr(c.MemberFirstName),
				LastName:    textPtr(c.MemberLastName),
				Nickname:    textPtr(c.MemberNickname),
				PicturePath: textPtr(c.MemberPicturePath),
			},
		}
	}

	return &ArticleDetail{ArticleSummary: summary, Comments: comments}, nil
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
		articleID := uuidStr(r.ArticleID)
		nameEn := textPtr(r.NameEn)
		result[articleID] = append(result[articleID], Tag{
			ID:        uuidStr(r.ID),
			Name:      resolveName(r.NameSv, nameEn, loc),
			NameSv:    r.NameSv,
			NameEn:    nameEn,
			Color:     textPtr(r.Color),
			IsDefault: r.IsDefault.Bool,
		})
	}
	return result, nil
}

func sanitizePtr(p *bluemonday.Policy, s *string) *string {
	if s == nil {
		return nil
	}
	sanitized := p.Sanitize(*s)
	return &sanitized
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
