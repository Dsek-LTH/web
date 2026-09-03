// Package booking is the booking domain (bookables + booking requests) -
// see DESIGN.md's Phase 5 ("Booking") section. Ported from
// src/routes/(app)/booking/*.
package booking

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/integrations"
)

var (
	ErrNotFound     = errors.New("booking: not found")
	ErrInvalidInput = errors.New("booking: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// upcomingWindow mirrors the old app's hardcoded "start >= now minus a
// week" filter for both the plain list page and the admin pages - there
// was never a caller-supplied date range in the old app, so none is
// exposed here either.
const upcomingWindow = -7 * 24 * time.Hour

type Service struct {
	queries  *db.Queries
	notifier integrations.Notifier
}

func NewService(dbtx db.DBTX, notifier integrations.Notifier) *Service {
	return &Service{queries: db.New(dbtx), notifier: notifier}
}

// --- Bookable categories ---

func (s *Service) ListBookableCategories(ctx context.Context) ([]BookableCategory, error) {
	if err := auth.Require(ctx, apinames.BookableRead); err != nil {
		return nil, err
	}
	rows, err := s.queries.ListBookableCategories(ctx)
	if err != nil {
		return nil, fmt.Errorf("list bookable categories: %w", err)
	}
	out := make([]BookableCategory, len(rows))
	for i, row := range rows {
		out[i] = toBookableCategory(row)
	}
	return out, nil
}

func (s *Service) CreateBookableCategory(
	ctx context.Context,
	in BookableCategoryInput,
) (*BookableCategory, error) {
	if err := auth.Require(ctx, apinames.BookableCreate); err != nil {
		return nil, err
	}
	if in.NameSv == "" {
		return nil, invalidf("nameSv is required")
	}
	row, err := s.queries.CreateBookableCategory(ctx, db.CreateBookableCategoryParams{
		NameSv: in.NameSv,
		NameEn: dbutil.ToText(in.NameEn),
	})
	if err != nil {
		return nil, fmt.Errorf("create bookable category: %w", err)
	}
	cat := toBookableCategory(row)
	return &cat, nil
}

func (s *Service) UpdateBookableCategory(
	ctx context.Context,
	id string,
	in BookableCategoryInput,
) (*BookableCategory, error) {
	if err := auth.Require(ctx, apinames.BookableUpdate); err != nil {
		return nil, err
	}
	if in.NameSv == "" {
		return nil, invalidf("nameSv is required")
	}
	uid, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid id: %v", err)
	}
	row, err := s.queries.UpdateBookableCategory(ctx, db.UpdateBookableCategoryParams{
		ID:     uid,
		NameSv: in.NameSv,
		NameEn: dbutil.ToText(in.NameEn),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update bookable category: %w", err)
	}
	cat := toBookableCategory(row)
	return &cat, nil
}

// --- Bookables ---

func (s *Service) ListBookables(ctx context.Context) ([]Bookable, error) {
	if err := auth.Require(ctx, apinames.BookableRead); err != nil {
		return nil, err
	}
	rows, err := s.queries.ListBookables(ctx)
	if err != nil {
		return nil, fmt.Errorf("list bookables: %w", err)
	}
	out := make([]Bookable, len(rows))
	for i, row := range rows {
		out[i] = toBookable(bookableRow{
			ID:               row.ID,
			NameSv:           row.NameSv,
			NameEn:           row.NameEn,
			IsDisabled:       row.IsDisabled,
			Door:             row.Door,
			CategoryID:       row.CategoryID,
			CategoryIDJoined: row.CategoryIDJoined,
			CategoryNameSv:   row.CategoryNameSv,
			CategoryNameEn:   row.CategoryNameEn,
		})
	}
	return out, nil
}

func (s *Service) GetBookable(ctx context.Context, id string) (*Bookable, error) {
	if err := auth.Require(ctx, apinames.BookableRead); err != nil {
		return nil, err
	}
	uid, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid id: %v", err)
	}
	row, err := s.queries.GetBookableByID(ctx, uid)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get bookable: %w", err)
	}
	b := toBookable(bookableRow{
		ID:               row.ID,
		NameSv:           row.NameSv,
		NameEn:           row.NameEn,
		IsDisabled:       row.IsDisabled,
		Door:             row.Door,
		CategoryID:       row.CategoryID,
		CategoryIDJoined: row.CategoryIDJoined,
		CategoryNameSv:   row.CategoryNameSv,
		CategoryNameEn:   row.CategoryNameEn,
	})
	return &b, nil
}

func (s *Service) CreateBookable(ctx context.Context, in BookableInput) (*Bookable, error) {
	if err := auth.Require(ctx, apinames.BookableCreate); err != nil {
		return nil, err
	}
	if in.NameSv == "" {
		return nil, invalidf("nameSv is required")
	}
	categoryID, err := dbutil.ParseUUIDPtr(in.CategoryID)
	if err != nil {
		return nil, invalidf("invalid categoryId: %v", err)
	}
	row, err := s.queries.CreateBookable(ctx, db.CreateBookableParams{
		NameSv:     in.NameSv,
		NameEn:     dbutil.ToText(in.NameEn),
		IsDisabled: in.IsDisabled,
		Door:       dbutil.ToText(in.Door),
		CategoryID: categoryID,
	})
	if err != nil {
		return nil, fmt.Errorf("create bookable: %w", err)
	}
	b := toBookableNoCategory(bookableNoCategoryRow{
		ID:         row.ID,
		NameSv:     row.NameSv,
		NameEn:     row.NameEn,
		IsDisabled: row.IsDisabled,
		Door:       row.Door,
		CategoryID: row.CategoryID,
	})
	return &b, nil
}

func (s *Service) UpdateBookable(
	ctx context.Context,
	id string,
	in BookableInput,
) (*Bookable, error) {
	if err := auth.Require(ctx, apinames.BookableUpdate); err != nil {
		return nil, err
	}
	if in.NameSv == "" {
		return nil, invalidf("nameSv is required")
	}
	uid, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid id: %v", err)
	}
	categoryID, err := dbutil.ParseUUIDPtr(in.CategoryID)
	if err != nil {
		return nil, invalidf("invalid categoryId: %v", err)
	}
	row, err := s.queries.UpdateBookable(ctx, db.UpdateBookableParams{
		ID:         uid,
		NameSv:     in.NameSv,
		NameEn:     dbutil.ToText(in.NameEn),
		IsDisabled: in.IsDisabled,
		Door:       dbutil.ToText(in.Door),
		CategoryID: categoryID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update bookable: %w", err)
	}
	b := toBookableNoCategory(bookableNoCategoryRow{
		ID:         row.ID,
		NameSv:     row.NameSv,
		NameEn:     row.NameEn,
		IsDisabled: row.IsDisabled,
		Door:       row.Door,
		CategoryID: row.CategoryID,
	})
	return &b, nil
}

// --- Booking requests ---

func (s *Service) List(ctx context.Context) ([]BookingRequest, error) {
	if err := auth.Require(ctx, apinames.BookingRequestRead); err != nil {
		return nil, err
	}
	since := time.Now().Add(upcomingWindow)
	rows, err := s.queries.ListUpcomingBookingRequests(ctx, dbutil.ToTimestamptz(&since))
	if err != nil {
		return nil, fmt.Errorf("list booking requests: %w", err)
	}

	ids := make([]pgtype.UUID, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}
	bookablesByRequest, err := s.bookablesForRequests(ctx, ids)
	if err != nil {
		return nil, err
	}

	out := make([]BookingRequest, len(rows))
	for i, row := range rows {
		br := toBookingRequest(bookingRequestRow{
			ID: row.ID, BookerID: row.BookerID, Start: row.Start, End: row.End,
			Created: row.Created, Event: row.Event, Status: row.Status,
			bookerRow: bookerRow{
				BookerMemberID:    row.BookerMemberID,
				BookerStudentID:   row.BookerStudentID,
				BookerFirstName:   row.BookerFirstName,
				BookerLastName:    row.BookerLastName,
				BookerNickname:    row.BookerNickname,
				BookerPicturePath: row.BookerPicturePath,
			},
		})
		br.Bookables = orEmptyBookables(bookablesByRequest[dbutil.UUIDStr(row.ID)])
		out[i] = br
	}
	return out, nil
}

func (s *Service) Get(ctx context.Context, id string) (*BookingRequest, error) {
	if err := auth.Require(ctx, apinames.BookingRequestRead); err != nil {
		return nil, err
	}
	uid, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid id: %v", err)
	}
	return s.getFull(ctx, uid)
}

// Create requires BookingRequestCreate (matches the old zmodel's
// @@allow("create", has(auth().policies, "booking_request:create")) - the
// old create page itself had no separate authorize() call). The acting
// identity becomes the booker; a member without policies simply can't
// reach this far (auth.Require already failed).
//
// Returns the created request plus any non-DENIED requests that overlap it
// in time for at least one shared bookable - a non-blocking warning
// (2026-09-02 decision, see DESIGN.md's Booking section): the old app never
// checked for this at all, so Go surfaces it as information rather than
// rejecting the request outright.
func (s *Service) Create(
	ctx context.Context,
	in BookingRequestInput,
) (*BookingRequest, []BookingRequest, error) {
	if err := auth.Require(ctx, apinames.BookingRequestCreate); err != nil {
		return nil, nil, err
	}
	identity, _ := auth.FromContext(ctx) // Require above guarantees this is present
	if err := validateBookingRequestInput(in); err != nil {
		return nil, nil, err
	}
	bookableIDs, err := dbutil.ParseUUIDs(in.BookableIDs)
	if err != nil {
		return nil, nil, invalidf("invalid bookable id: %v", err)
	}

	var bookerID pgtype.UUID
	if identity.MemberID != "" {
		bookerID, err = dbutil.ParseUUID(identity.MemberID)
		if err != nil {
			return nil, nil, fmt.Errorf("parse acting member id: %w", err)
		}
	}

	row, err := s.queries.CreateBookingRequest(ctx, db.CreateBookingRequestParams{
		BookerID: bookerID,
		Start:    dbutil.ToTimestamptz(&in.Start),
		End:      dbutil.ToTimestamptz(&in.End),
		Event:    dbutil.ToText(&in.Event),
		Status:   db.BookingRequestStatusPENDING,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("create booking request: %w", err)
	}
	if err := s.queries.AddBookingRequestBookables(ctx, db.AddBookingRequestBookablesParams{
		BookableIds:      bookableIDs,
		BookingRequestID: row.ID,
	}); err != nil {
		return nil, nil, fmt.Errorf("link bookables: %w", err)
	}

	conflicts, err := s.conflicts(ctx, bookableIDs, in.Start, in.End, &row.ID)
	if err != nil {
		return nil, nil, err
	}

	result, err := s.getFull(ctx, row.ID)
	if err != nil {
		return nil, nil, err
	}

	s.notifyNewBookingRequest(ctx, result, identity.MemberID)

	return result, conflicts, nil
}

// Update is a full-replace, same PUT-dressed-as-PATCH convention as
// articles/events/songs. Authorization extends the zmodel's delete bypass
// (has(BookingRequestUpdate) || auth().memberId == bookerId) to update too
// - the old zmodel only allowed the former for update, meaning in practice
// only an admin-equivalent caller could ever edit a booking, including
// their own; this closes that gap deliberately (see DESIGN.md's Booking
// section) rather than replicate a booker being unable to edit their own
// pending request the way they can already delete it. A self-edit resets
// status to PENDING (forcing re-review); an admin edit (someone holding
// BookingRequestUpdate) preserves whatever status was submitted.
func (s *Service) Update(
	ctx context.Context,
	id string,
	in BookingRequestInput,
) (*BookingRequest, []BookingRequest, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return nil, nil, auth.ErrUnauthenticated
	}
	uid, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, nil, invalidf("invalid id: %v", err)
	}
	existing, err := s.queries.GetBookingRequestByID(ctx, uid)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil, ErrNotFound
		}
		return nil, nil, fmt.Errorf("get booking request: %w", err)
	}
	isAdmin := identity.Has(apinames.BookingRequestUpdate)
	isOwner := existing.BookerID.Valid && dbutil.UUIDStr(existing.BookerID) == identity.MemberID
	if !isAdmin && !isOwner {
		return nil, nil, auth.ErrForbidden
	}
	if err := validateBookingRequestInput(in); err != nil {
		return nil, nil, err
	}
	bookableIDs, err := dbutil.ParseUUIDs(in.BookableIDs)
	if err != nil {
		return nil, nil, invalidf("invalid bookable id: %v", err)
	}

	status := existing.Status
	if !isAdmin {
		status = db.BookingRequestStatusPENDING
	}

	if _, err := s.queries.UpdateBookingRequest(ctx, db.UpdateBookingRequestParams{
		ID:     uid,
		Start:  dbutil.ToTimestamptz(&in.Start),
		End:    dbutil.ToTimestamptz(&in.End),
		Event:  dbutil.ToText(&in.Event),
		Status: status,
	}); err != nil {
		return nil, nil, fmt.Errorf("update booking request: %w", err)
	}
	if err := s.queries.ClearBookingRequestBookables(ctx, uid); err != nil {
		return nil, nil, fmt.Errorf("clear bookables: %w", err)
	}
	if err := s.queries.AddBookingRequestBookables(ctx, db.AddBookingRequestBookablesParams{
		BookableIds:      bookableIDs,
		BookingRequestID: uid,
	}); err != nil {
		return nil, nil, fmt.Errorf("link bookables: %w", err)
	}

	conflicts, err := s.conflicts(ctx, bookableIDs, in.Start, in.End, &uid)
	if err != nil {
		return nil, nil, err
	}

	result, err := s.getFull(ctx, uid)
	if err != nil {
		return nil, nil, err
	}
	return result, conflicts, nil
}

// Delete mirrors the zmodel exactly:
// @@allow("delete", has(...,"booking_request:delete")) ||
// auth().memberId == bookerId - a hard delete (there was never a
// soft-delete column here), same as the old app's plain
// prisma.bookingRequest.delete.
func (s *Service) Delete(ctx context.Context, id string) error {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return auth.ErrUnauthenticated
	}
	uid, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid id: %v", err)
	}
	existing, err := s.queries.GetBookingRequestByID(ctx, uid)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get booking request: %w", err)
	}
	isOwner := existing.BookerID.Valid && dbutil.UUIDStr(existing.BookerID) == identity.MemberID
	if !identity.Has(apinames.BookingRequestDelete) && !isOwner {
		return auth.ErrForbidden
	}
	if err := s.queries.DeleteBookingRequest(ctx, uid); err != nil {
		return fmt.Errorf("delete booking request: %w", err)
	}
	return nil
}

// SetStatus is the accept/reject admin action - requires BookingRequestUpdate
// (matches the old app's authorize(apiNames.BOOKINGS.UPDATE) gate on the
// admin pages that call it; the plain booker never gets an accept/reject
// button).
func (s *Service) SetStatus(
	ctx context.Context,
	id string,
	accepted bool,
) (*BookingRequest, error) {
	if err := auth.Require(ctx, apinames.BookingRequestUpdate); err != nil {
		return nil, err
	}
	identity, _ := auth.FromContext(ctx) // Require above guarantees this is present
	uid, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid id: %v", err)
	}
	existing, err := s.queries.GetBookingRequestByID(ctx, uid)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get booking request: %w", err)
	}

	status := db.BookingRequestStatusDENIED
	statusText := "denied"
	if accepted {
		status = db.BookingRequestStatusACCEPTED
		statusText = "accepted"
	}
	if _, err := s.queries.UpdateBookingRequestStatus(ctx, db.UpdateBookingRequestStatusParams{
		ID:     uid,
		Status: status,
	}); err != nil {
		return nil, fmt.Errorf("update booking request status: %w", err)
	}

	result, err := s.getFull(ctx, uid)
	if err != nil {
		return nil, err
	}

	if existing.BookerID.Valid {
		names := make([]string, len(result.Bookables))
		for i, b := range result.Bookables {
			names[i] = b.Name
		}
		var start, end time.Time
		if result.Start != nil {
			start = *result.Start
		}
		if result.End != nil {
			end = *result.End
		}
		n := integrations.BookingRequestNotification{
			BookingRequestID:  result.ID,
			Event:             dbutil.StringOr(result.Event, ""),
			Start:             start,
			End:               end,
			BookableNames:     names,
			RequesterMemberID: identity.MemberID,
			RecipientMemberID: dbutil.UUIDStr(existing.BookerID),
			Status:            statusText,
		}
		if err := s.notifier.NotifyBookingRequestStatus(ctx, n); err != nil {
			log.Printf("booking: notify booking request status: %v", err)
		}
	}

	return result, nil
}

func validateBookingRequestInput(in BookingRequestInput) error {
	if in.Event == "" {
		return invalidf("event is required")
	}
	if len(in.BookableIDs) == 0 {
		return invalidf("at least one bookable is required")
	}
	if !in.Start.Before(in.End) {
		return invalidf("start must be before end")
	}
	return nil
}

// notifyNewBookingRequest mirrors sendNotificationToKM: best-effort, logged
// on failure, never blocks the caller - the old app caught and logged this
// exact call without failing the create action.
func (s *Service) notifyNewBookingRequest(
	ctx context.Context,
	br *BookingRequest,
	requesterMemberID string,
) {
	km, err := s.queries.GetCurrentKarhusmastare(ctx)
	if err != nil {
		log.Printf(
			"booking: no active karhusmastare found, skipping new-request notification: %v",
			err,
		)
		return
	}
	names := make([]string, len(br.Bookables))
	for i, b := range br.Bookables {
		names[i] = b.Name
	}
	var start, end time.Time
	if br.Start != nil {
		start = *br.Start
	}
	if br.End != nil {
		end = *br.End
	}
	n := integrations.BookingRequestNotification{
		BookingRequestID:  br.ID,
		Event:             dbutil.StringOr(br.Event, ""),
		Start:             start,
		End:               end,
		BookableNames:     names,
		RequesterMemberID: requesterMemberID,
		RecipientMemberID: dbutil.UUIDStr(km.ID),
	}
	if err := s.notifier.NotifyNewBookingRequest(ctx, n); err != nil {
		log.Printf("booking: notify new booking request: %v", err)
	}
}

// conflicts finds other non-DENIED booking requests sharing at least one of
// bookableIDs whose [start,end) overlaps [start,end) - a non-blocking
// warning, see Create's doc comment. excludeID always points at the
// request being created/edited itself, so it never appears in its own
// conflict list.
func (s *Service) conflicts(
	ctx context.Context,
	bookableIDs []pgtype.UUID,
	start, end time.Time,
	excludeID *pgtype.UUID,
) ([]BookingRequest, error) {
	var exclude pgtype.UUID
	if excludeID != nil {
		exclude = *excludeID
	}
	rows, err := s.queries.ListConflictingBookingRequests(
		ctx,
		db.ListConflictingBookingRequestsParams{
			BookableIds: bookableIDs,
			ExcludeID:   exclude,
			StartAt:     dbutil.ToTimestamptz(&start),
			EndAt:       dbutil.ToTimestamptz(&end),
		},
	)
	if err != nil {
		return nil, fmt.Errorf("list conflicting booking requests: %w", err)
	}

	ids := make([]pgtype.UUID, len(rows))
	for i, row := range rows {
		ids[i] = row.ID
	}
	bookablesByRequest, err := s.bookablesForRequests(ctx, ids)
	if err != nil {
		return nil, err
	}

	out := make([]BookingRequest, len(rows))
	for i, row := range rows {
		br := toBookingRequest(bookingRequestRow{
			ID: row.ID, BookerID: row.BookerID, Start: row.Start, End: row.End,
			Created: row.Created, Event: row.Event, Status: row.Status,
			bookerRow: bookerRow{
				BookerMemberID:    row.BookerMemberID,
				BookerStudentID:   row.BookerStudentID,
				BookerFirstName:   row.BookerFirstName,
				BookerLastName:    row.BookerLastName,
				BookerNickname:    row.BookerNickname,
				BookerPicturePath: row.BookerPicturePath,
			},
		})
		br.Bookables = orEmptyBookables(bookablesByRequest[dbutil.UUIDStr(row.ID)])
		out[i] = br
	}
	return out, nil
}

func (s *Service) getFull(ctx context.Context, id pgtype.UUID) (*BookingRequest, error) {
	row, err := s.queries.GetBookingRequestByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get booking request: %w", err)
	}
	bookablesByRequest, err := s.bookablesForRequests(ctx, []pgtype.UUID{id})
	if err != nil {
		return nil, err
	}
	br := toBookingRequest(bookingRequestRow{
		ID: row.ID, BookerID: row.BookerID, Start: row.Start, End: row.End,
		Created: row.Created, Event: row.Event, Status: row.Status,
		bookerRow: bookerRow{
			BookerMemberID:    row.BookerMemberID,
			BookerStudentID:   row.BookerStudentID,
			BookerFirstName:   row.BookerFirstName,
			BookerLastName:    row.BookerLastName,
			BookerNickname:    row.BookerNickname,
			BookerPicturePath: row.BookerPicturePath,
		},
	})
	br.Bookables = orEmptyBookables(bookablesByRequest[dbutil.UUIDStr(id)])
	return &br, nil
}

func (s *Service) bookablesForRequests(
	ctx context.Context,
	ids []pgtype.UUID,
) (map[string][]Bookable, error) {
	if len(ids) == 0 {
		return map[string][]Bookable{}, nil
	}
	rows, err := s.queries.ListBookablesForBookingRequests(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("list bookables for booking requests: %w", err)
	}
	out := map[string][]Bookable{}
	for _, row := range rows {
		key := dbutil.UUIDStr(row.BookingRequestID)
		out[key] = append(out[key], toBookableNoCategory(bookableNoCategoryRow{
			ID:         row.ID,
			NameSv:     row.NameSv,
			NameEn:     row.NameEn,
			IsDisabled: row.IsDisabled,
			Door:       row.Door,
			CategoryID: row.CategoryID,
		}))
	}
	return out, nil
}
