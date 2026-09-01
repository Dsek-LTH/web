package events

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/microcosm-cc/bluemonday"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/locale"
	"github.com/dsek-lth/web/backend/internal/slug"
)

// ErrNotFound is returned when an event, comment, or recurring-series
// lookup by identifier finds nothing.
var ErrNotFound = errors.New("events: not found")

// ErrInvalidInput is wrapped into errors caused by malformed caller input
// (e.g. a UUID that doesn't parse), so the API layer can map them to 400
// instead of 500 - same convention as internal/articles.
var ErrInvalidInput = errors.New("events: invalid input")

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

const defaultPageSize = 10

// Service is the events domain/service layer, mirroring
// internal/articles.Service's shape and conventions (typed inputs, acting
// identity always read from context via internal/auth, never from request
// bodies). It additionally holds a *pgxpool.Pool (not just db.DBTX) because
// creating a recurring series needs a real transaction across the
// RecurringEvent row and every occurrence's Event row - the only place in
// this port that needs one; see Create.
//
// Not ported yet (no interface/method exists because nothing depends on it
// in this pass - see DESIGN.md's events section for the full list):
// push notifications to the organizer on going/interested, the calendar
// range endpoint, the ICS subscribe feed, and the full-text typeahead
// search endpoint. All are additive - none block the CRUD/recurring/
// going-interested/comments/tags surface this Service already covers.
type Service struct {
	pool      *pgxpool.Pool
	queries   *db.Queries
	sanitizer *bluemonday.Policy
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{
		pool:      pool,
		queries:   db.New(pool),
		sanitizer: bluemonday.UGCPolicy(),
	}
}

func (s *Service) List(ctx context.Context, params ListParams) ([]EventSummary, int, error) {
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
	search := dbutil.TextOrInvalid(params.Search)

	rows, err := s.queries.ListEvents(ctx, db.ListEventsParams{
		Past:   params.Past,
		Search: search,
		TagIds: tagIDs,
		Limit:  int32(pageSize),
		Offset: int32((page - 1) * pageSize),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("list events: %w", err)
	}

	total, err := s.queries.CountEvents(ctx, db.CountEventsParams{
		Past:   params.Past,
		Search: search,
		TagIds: tagIDs,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("count events: %w", err)
	}

	loc := locale.FromContext(ctx)
	ids := make([]pgtype.UUID, len(rows))
	summaries := make([]EventSummary, len(rows))
	for i, row := range rows {
		summaries[i] = toEventSummary(row, loc)
		ids[i] = row.ID
	}

	tagsByEvent, err := s.tagsByEvent(ctx, ids)
	if err != nil {
		return nil, 0, err
	}
	for i := range summaries {
		summaries[i].Tags = orEmptyTags(tagsByEvent[summaries[i].ID])
	}

	pageCount := int((total + int64(pageSize) - 1) / int64(pageSize))
	return summaries, pageCount, nil
}

// Get returns a non-removed event by slug - the public detail view. The
// old TS getEvent() applied no removed_at filter at all here (see
// DESIGN.md's events section); fixed rather than replicated.
func (s *Service) Get(ctx context.Context, slug string) (*EventDetail, error) {
	row, err := s.queries.GetEventBySlug(ctx, dbutil.ToText(&slug))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get event: %w", err)
	}
	return s.detail(ctx, db.ListEventsRow(row))
}

// GetAny returns an event by slug regardless of soft-delete status - for an
// editor loading an event they might need to un-cancel or otherwise manage.
func (s *Service) GetAny(ctx context.Context, slug string) (*EventDetail, error) {
	return s.getBySlugUnfiltered(ctx, slug)
}

// Create makes a single event, or - when in.Recurring is set - a whole
// series: one RecurringEvent row plus one Event row per computed
// occurrence (see expandOccurrences), every occurrence sharing the same
// content but its own start/end datetime and its own sequentially-suffixed
// slug ("my-event", "my-event-2", ...). The series path runs inside a
// transaction (the only place this Service needs one) since a partial
// series would be a real user-visible bug, unlike the non-recurring path's
// two independent statements (create, then set tags) which - same as
// internal/articles.Service.Create - aren't transactional together.
func (s *Service) Create(ctx context.Context, in EventInput) (*EventDetail, error) {
	if err := auth.Require(ctx, apinames.EventCreate); err != nil {
		return nil, err
	}
	identity, _ := auth.FromContext(ctx) // Require above guarantees this is present

	authorID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return nil, invalidf("invalid member id: %v", err)
	}
	tagIDs, err := dbutil.ParseUUIDs(in.TagIDs)
	if err != nil {
		return nil, invalidf("invalid tag id: %v", err)
	}

	base := slug.Slugify(in.TitleSv)
	slugCount, err := s.queries.CountEventSlugsWithPrefix(
		ctx,
		pgtype.Text{String: base, Valid: true},
	)
	if err != nil {
		return nil, fmt.Errorf("count slugs: %w", err)
	}

	if in.Recurring == nil {
		firstSlug := slug.SlugWithCount(base, int(slugCount))
		created, err := s.queries.CreateEvent(
			ctx,
			s.createParams(in, authorID, firstSlug, pgtype.UUID{}),
		)
		if err != nil {
			return nil, fmt.Errorf("create event: %w", err)
		}
		if err := s.setTags(ctx, created.ID, tagIDs); err != nil {
			return nil, err
		}
		return s.getBySlugUnfiltered(ctx, created.Slug.String)
	}

	occurrences, err := expandOccurrences(
		in.StartAt, in.EndAt, in.Recurring.EndAt,
		in.Recurring.SeparationCount, in.Recurring.Type,
	)
	if err != nil {
		return nil, err
	}
	if len(occurrences) == 0 {
		return nil, invalidf("recurring series produced no occurrences")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // no-op once committed
	qtx := s.queries.WithTx(tx)

	recurringID, err := qtx.CreateRecurringEvent(ctx, db.CreateRecurringEventParams{
		SeparationCount: int32(in.Recurring.SeparationCount),
		RecurringType:   db.RecurringType(in.Recurring.Type),
		AuthorID:        authorID,
		StartDatetime:   dbutil.ToTimestamptz(&in.StartAt),
		EndDatetime:     dbutil.ToTimestamptz(&in.Recurring.EndAt),
	})
	if err != nil {
		return nil, fmt.Errorf("create recurring event: %w", err)
	}

	var firstSlug string
	for i, occ := range occurrences {
		occSlug := slug.SlugWithCount(base, int(slugCount)+i)
		if i == 0 {
			firstSlug = occSlug
		}
		occIn := in
		occIn.StartAt = occ.Start
		occIn.EndAt = occ.End
		created, err := qtx.CreateEvent(ctx, s.createParams(occIn, authorID, occSlug, recurringID))
		if err != nil {
			return nil, fmt.Errorf("create occurrence %d: %w", i, err)
		}
		if len(tagIDs) > 0 {
			if err := qtx.AddEventTags(ctx, db.AddEventTagsParams{
				EventID: created.ID,
				TagIds:  tagIDs,
			}); err != nil {
				return nil, fmt.Errorf("set occurrence %d tags: %w", i, err)
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return s.getBySlugUnfiltered(ctx, firstSlug)
}

func (s *Service) createParams(
	in EventInput,
	authorID pgtype.UUID,
	eventSlug string,
	recurringParentID pgtype.UUID,
) db.CreateEventParams {
	return db.CreateEventParams{
		TitleSv:            in.TitleSv,
		TitleEn:            dbutil.ToText(in.TitleEn),
		DescriptionSv:      s.sanitizer.Sanitize(in.DescriptionSv),
		DescriptionEn:      dbutil.ToText(sanitizePtr(s.sanitizer, in.DescriptionEn)),
		Link:               dbutil.ToText(in.Link),
		Location:           dbutil.ToText(in.Location),
		Organizer:          in.Organizer,
		AuthorID:           authorID,
		ShortDescriptionSv: dbutil.ToText(in.ShortDescriptionSv),
		ShortDescriptionEn: dbutil.ToText(in.ShortDescriptionEn),
		StartDatetime:      dbutil.ToTimestamptz(&in.StartAt),
		EndDatetime:        dbutil.ToTimestamptz(&in.EndAt),
		Slug:               pgtype.Text{String: eventSlug, Valid: true},
		ImageUrl:           dbutil.ToText(in.ImageURL),
		AlarmActive:        pgtype.Bool{Bool: in.AlarmActive, Valid: true},
		IsCancelled:        pgtype.Bool{Bool: in.IsCancelled, Valid: true},
		RecurringParentID:  recurringParentID,
	}
}

// Update replaces every writable field of an event (PUT semantics, not a
// partial patch - same convention as articles). scope controls how a
// recurring occurrence's siblings are affected:
//   - This (default, and the only meaningful value for a non-recurring
//     event): only this occurrence is touched.
//   - Future/All: every sibling in the series (from this occurrence
//     onward, or all of them) gets the same new content, but each keeps
//     its own original date - only the submitted start/end time-of-day
//     shifts, reconstructed in Europe/Stockholm per sibling. This mirrors
//     the old TS updateEvent's FUTURE/ALL branch exactly (see DESIGN.md).
//
// Unlike articles.Service.Update, the acting identity never replaces
// author_id here - see the doc comment on db.UpdateEventParams's query and
// DESIGN.md's events section for why events deliberately diverge from
// articles on this point (author_id is a permission anchor here, not a
// displayed byline).
func (s *Service) Update(
	ctx context.Context,
	eventSlug string,
	in EventInput,
	scope EditScope,
) (*EventDetail, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return nil, auth.ErrUnauthenticated
	}

	current, err := s.queries.GetEventRowBySlug(ctx, dbutil.ToText(&eventSlug))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get event: %w", err)
	}

	if dbutil.UUIDStr(current.AuthorMemberID) != identity.MemberID {
		if err := auth.Require(ctx, apinames.EventUpdate); err != nil {
			return nil, err
		}
	}

	tagIDs, err := dbutil.ParseUUIDs(in.TagIDs)
	if err != nil {
		return nil, invalidf("invalid tag id: %v", err)
	}

	targets := []db.ListEventSiblingsRow{{
		ID:            current.ID,
		Slug:          current.Slug,
		StartDatetime: current.StartDatetime,
		EndDatetime:   current.EndDatetime,
	}}
	seriesEdit := current.RecurringParentID.Valid && scope != EditScopeThis
	if seriesEdit {
		minStart := pgtype.Timestamptz{}
		if scope == EditScopeFuture {
			minStart = current.StartDatetime
		}
		siblings, err := s.queries.ListEventSiblings(ctx, db.ListEventSiblingsParams{
			RecurringParentID: current.RecurringParentID,
			MinStartDatetime:  minStart,
		})
		if err != nil {
			return nil, fmt.Errorf("list siblings: %w", err)
		}
		if len(siblings) > 0 {
			targets = siblings
		}
	}

	var updatedSlug string
	for i, t := range targets {
		startAt, endAt := in.StartAt, in.EndAt
		if seriesEdit {
			// Series edit (every target, including the occurrence being
			// edited): keep this occurrence's own date, apply only the
			// submitted time-of-day (see doc comment above). A plain
			// This-scope edit instead takes the submitted start/end
			// exactly as given, free to change the date too.
			startAt, endAt, err = retimeOccurrence(
				t.StartDatetime.Time,
				t.EndDatetime.Time,
				in.StartAt,
				in.EndAt,
			)
			if err != nil {
				return nil, err
			}
		}
		occIn := in
		occIn.StartAt, occIn.EndAt = startAt, endAt

		updated, err := s.queries.UpdateEvent(ctx, db.UpdateEventParams{
			ID:                 t.ID,
			TitleSv:            occIn.TitleSv,
			TitleEn:            dbutil.ToText(occIn.TitleEn),
			DescriptionSv:      s.sanitizer.Sanitize(occIn.DescriptionSv),
			DescriptionEn:      dbutil.ToText(sanitizePtr(s.sanitizer, occIn.DescriptionEn)),
			Link:               dbutil.ToText(occIn.Link),
			Location:           dbutil.ToText(occIn.Location),
			Organizer:          occIn.Organizer,
			ShortDescriptionSv: dbutil.ToText(occIn.ShortDescriptionSv),
			ShortDescriptionEn: dbutil.ToText(occIn.ShortDescriptionEn),
			StartDatetime:      dbutil.ToTimestamptz(&occIn.StartAt),
			EndDatetime:        dbutil.ToTimestamptz(&occIn.EndAt),
			ImageUrl:           dbutil.ToText(occIn.ImageURL),
			AlarmActive:        pgtype.Bool{Bool: occIn.AlarmActive, Valid: true},
			IsCancelled:        pgtype.Bool{Bool: occIn.IsCancelled, Valid: true},
		})
		if err != nil {
			return nil, fmt.Errorf("update occurrence %d: %w", i, err)
		}
		if err := s.setTags(ctx, updated.ID, tagIDs); err != nil {
			return nil, err
		}
		if t.ID == current.ID {
			updatedSlug = updated.Slug.String
		}
	}

	return s.getBySlugUnfiltered(ctx, updatedSlug)
}

// retimeOccurrence reconstructs origStart/origEnd's dates with
// newStart/newEnd's Europe/Stockholm wall-clock time-of-day, preserving
// origStart/origEnd's own day offset - the per-sibling half of a
// Future/All series edit (see Update's doc comment).
func retimeOccurrence(
	origStart, origEnd, newStart, newEnd time.Time,
) (time.Time, time.Time, error) {
	loc, err := time.LoadLocation(stockholmTZ)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("load %s: %w", stockholmTZ, err)
	}
	origStartLocal := origStart.In(loc)
	origEndLocal := origEnd.In(loc)
	newStartLocal := newStart.In(loc)
	newEndLocal := newEnd.In(loc)

	sh, sm, ss := newStartLocal.Clock()
	eh, em, es := newEndLocal.Clock()

	retimedStart := time.Date(
		origStartLocal.Year(), origStartLocal.Month(), origStartLocal.Day(),
		sh, sm, ss, newStartLocal.Nanosecond(), loc,
	)
	retimedEnd := time.Date(
		origEndLocal.Year(), origEndLocal.Month(), origEndLocal.Day(),
		eh, em, es, newEndLocal.Nanosecond(), loc,
	)
	return retimedStart, retimedEnd, nil
}

// Delete soft-deletes an event (sets removed_at); it does not remove the
// row. Unlike Update, there's no "author of this event" bypass - only
// apinames.EventDelete, matching the old TS removeEventAction's real
// permission check exactly (its canEdit-style author bypass is an
// edit-only allowance, not a delete one). scope works like Update's,
// except the old FUTURE branch's missing return path (see DESIGN.md's
// events section) isn't reproduced - Delete always completes for whichever
// scope was requested.
func (s *Service) Delete(ctx context.Context, eventSlug string, scope EditScope) error {
	if err := auth.Require(ctx, apinames.EventDelete); err != nil {
		return err
	}

	current, err := s.queries.GetEventRowBySlug(ctx, dbutil.ToText(&eventSlug))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get event: %w", err)
	}

	if !current.RecurringParentID.Valid || scope == EditScopeThis {
		if err := s.queries.SoftDeleteEvent(ctx, current.ID); err != nil {
			return fmt.Errorf("delete event: %w", err)
		}
		return nil
	}

	minStart := pgtype.Timestamptz{}
	if scope == EditScopeFuture {
		minStart = current.StartDatetime
	}
	if err := s.queries.SoftDeleteEventSeries(ctx, db.SoftDeleteEventSeriesParams{
		RecurringParentID: current.RecurringParentID,
		MinStartDatetime:  minStart,
	}); err != nil {
		return fmt.Errorf("delete event series: %w", err)
	}
	return nil
}

// SetGoing marks the acting member as going, clearing any "interested"
// mark - going and interested are mutually exclusive by convention (see
// internal/db/queries/event_attendance.sql's doc comment), enforced here
// rather than left to fixed call sites the way the old TS code did.
func (s *Service) SetGoing(ctx context.Context, eventSlug string) error {
	return s.setAttendance(ctx, eventSlug, true, false)
}

func (s *Service) SetInterested(ctx context.Context, eventSlug string) error {
	return s.setAttendance(ctx, eventSlug, false, true)
}

func (s *Service) ClearAttendance(ctx context.Context, eventSlug string) error {
	return s.setAttendance(ctx, eventSlug, false, false)
}

func (s *Service) setAttendance(
	ctx context.Context,
	eventSlug string,
	going, interested bool,
) error {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return auth.ErrUnauthenticated
	}
	eventID, err := s.queries.GetEventIDBySlug(ctx, dbutil.ToText(&eventSlug))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("find event: %w", err)
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return invalidf("invalid member id: %v", err)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck // no-op once committed
	qtx := s.queries.WithTx(tx)

	if going {
		if err := qtx.AddEventGoing(
			ctx,
			db.AddEventGoingParams{EventID: eventID, MemberID: memberUUID},
		); err != nil {
			return fmt.Errorf("set going: %w", err)
		}
	} else if err := qtx.RemoveEventGoing(ctx, db.RemoveEventGoingParams{EventID: eventID, MemberID: memberUUID}); err != nil {
		return fmt.Errorf("clear going: %w", err)
	}
	if interested {
		if err := qtx.AddEventInterested(
			ctx,
			db.AddEventInterestedParams{EventID: eventID, MemberID: memberUUID},
		); err != nil {
			return fmt.Errorf("set interested: %w", err)
		}
	} else if err := qtx.RemoveEventInterested(ctx, db.RemoveEventInterestedParams{EventID: eventID, MemberID: memberUUID}); err != nil {
		return fmt.Errorf("clear interested: %w", err)
	}

	return tx.Commit(ctx)
}

// AddComment ports the events entity-type branch of src/lib/zod/comments.ts,
// but gated on apinames.EventComment - the old code only checked "is
// someone logged in", with no policy check at all despite
// apiNames.EVENT.COMMENT existing (see DESIGN.md's events section).
func (s *Service) AddComment(ctx context.Context, eventSlug, content string) (*Comment, error) {
	if err := auth.Require(ctx, apinames.EventComment); err != nil {
		return nil, err
	}
	identity, _ := auth.FromContext(ctx)

	eventID, err := s.queries.GetEventIDBySlug(ctx, dbutil.ToText(&eventSlug))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("find event: %w", err)
	}
	memberUUID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return nil, invalidf("invalid member id: %v", err)
	}

	sanitized := s.sanitizer.Sanitize(content)
	created, err := s.queries.CreateEventComment(ctx, db.CreateEventCommentParams{
		EventID:  eventID,
		MemberID: memberUUID,
		Content:  pgtype.Text{String: sanitized, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("create comment: %w", err)
	}

	return &Comment{
		ID:        dbutil.UUIDStr(created.ID),
		Content:   &sanitized,
		Published: created.Published.Time,
		Member:    Member{ID: identity.MemberID},
	}, nil
}

// RemoveComment is gated on apinames.EventCommentDelete - the old TS
// removeCommentAction("EVENT") had no authorization check at all (any
// visitor could delete any comment on any event), a real bug flagged in
// DESIGN.md's events section and fixed here, not replicated. Matches
// articles.Service.RemoveComment's already-correct pattern exactly.
func (s *Service) RemoveComment(ctx context.Context, eventSlug, commentID string) error {
	if err := auth.Require(ctx, apinames.EventCommentDelete); err != nil {
		return err
	}
	eventID, err := s.queries.GetEventIDBySlug(ctx, dbutil.ToText(&eventSlug))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("find event: %w", err)
	}
	commentUUID, err := dbutil.ParseUUID(commentID)
	if err != nil {
		return invalidf("invalid comment id: %v", err)
	}
	if err := s.queries.DeleteEventComment(ctx, db.DeleteEventCommentParams{
		CommentID: commentUUID,
		EventID:   eventID,
	}); err != nil {
		return fmt.Errorf("delete comment: %w", err)
	}
	return nil
}

func (s *Service) setTags(ctx context.Context, eventID pgtype.UUID, tagIDs []pgtype.UUID) error {
	if err := s.queries.ClearEventTags(ctx, eventID); err != nil {
		return fmt.Errorf("clear tags: %w", err)
	}
	if len(tagIDs) == 0 {
		return nil
	}
	if err := s.queries.AddEventTags(ctx, db.AddEventTagsParams{
		EventID: eventID,
		TagIds:  tagIDs,
	}); err != nil {
		return fmt.Errorf("set tags: %w", err)
	}
	return nil
}

func (s *Service) getBySlugUnfiltered(ctx context.Context, eventSlug string) (*EventDetail, error) {
	row, err := s.queries.GetEventRowBySlug(ctx, dbutil.ToText(&eventSlug))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get event: %w", err)
	}
	return s.detail(ctx, db.ListEventsRow(row))
}

func (s *Service) detail(ctx context.Context, row db.ListEventsRow) (*EventDetail, error) {
	summary := toEventSummary(row, locale.FromContext(ctx))

	tagsByEvent, err := s.tagsByEvent(ctx, []pgtype.UUID{row.ID})
	if err != nil {
		return nil, err
	}
	summary.Tags = orEmptyTags(tagsByEvent[summary.ID])

	commentRows, err := s.queries.ListEventComments(ctx, row.ID)
	if err != nil {
		return nil, fmt.Errorf("list comments: %w", err)
	}
	comments := make([]Comment, len(commentRows))
	for i, c := range commentRows {
		comments[i] = Comment{
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

	going, err := s.queries.ListEventGoing(ctx, row.ID)
	if err != nil {
		return nil, fmt.Errorf("list going: %w", err)
	}
	interested, err := s.queries.ListEventInterested(ctx, row.ID)
	if err != nil {
		return nil, fmt.Errorf("list interested: %w", err)
	}

	goingMembers := make([]Member, len(going))
	for i, m := range going {
		goingMembers[i] = Member{
			ID:          dbutil.UUIDStr(m.ID),
			StudentID:   dbutil.TextPtr(m.StudentID),
			FirstName:   dbutil.TextPtr(m.FirstName),
			LastName:    dbutil.TextPtr(m.LastName),
			Nickname:    dbutil.TextPtr(m.Nickname),
			PicturePath: dbutil.TextPtr(m.PicturePath),
		}
	}
	interestedMembers := make([]Member, len(interested))
	for i, m := range interested {
		interestedMembers[i] = Member{
			ID:          dbutil.UUIDStr(m.ID),
			StudentID:   dbutil.TextPtr(m.StudentID),
			FirstName:   dbutil.TextPtr(m.FirstName),
			LastName:    dbutil.TextPtr(m.LastName),
			Nickname:    dbutil.TextPtr(m.Nickname),
			PicturePath: dbutil.TextPtr(m.PicturePath),
		}
	}

	return &EventDetail{
		EventSummary: summary,
		Comments:     comments,
		Going:        orEmptyMembers(goingMembers),
		Interested:   orEmptyMembers(interestedMembers),
	}, nil
}

func (s *Service) tagsByEvent(ctx context.Context, ids []pgtype.UUID) (map[string][]Tag, error) {
	result := make(map[string][]Tag, len(ids))
	if len(ids) == 0 {
		return result, nil
	}
	rows, err := s.queries.ListTagsForEvents(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("list event tags: %w", err)
	}
	loc := locale.FromContext(ctx)
	for _, r := range rows {
		eventID := dbutil.UUIDStr(r.EventID)
		nameEn := dbutil.TextPtr(r.NameEn)
		result[eventID] = append(result[eventID], Tag{
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

func sanitizePtr(p *bluemonday.Policy, s *string) *string {
	if s == nil {
		return nil
	}
	sanitized := p.Sanitize(*s)
	return &sanitized
}
