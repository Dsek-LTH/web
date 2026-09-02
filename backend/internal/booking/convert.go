package booking

import (
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apitypes"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

func toBookableCategory(row db.BookableCategory) BookableCategory {
	return BookableCategory{
		ID:     dbutil.UUIDStr(row.ID),
		Name:   row.NameSv,
		NameSv: row.NameSv,
		NameEn: dbutil.TextPtr(row.NameEn),
	}
}

// bookableRow is a small adapter every joined-with-category sqlc row type
// (ListBookablesRow, GetBookableByIDRow) copies into, same pattern as
// internal/committees' committeeRow/positionRow - the two queries share an
// identical SELECT list/column order so the conversion is one plain field
// copy at each call site.
type bookableRow struct {
	ID               pgtype.UUID
	NameSv           string
	NameEn           pgtype.Text
	IsDisabled       bool
	Door             pgtype.Text
	CategoryID       pgtype.UUID
	CategoryIDJoined pgtype.UUID
	CategoryNameSv   pgtype.Text
	CategoryNameEn   pgtype.Text
}

func toBookable(row bookableRow) Bookable {
	b := Bookable{
		ID:         dbutil.UUIDStr(row.ID),
		Name:       row.NameSv,
		NameSv:     row.NameSv,
		NameEn:     dbutil.TextPtr(row.NameEn),
		IsDisabled: row.IsDisabled,
		Door:       dbutil.TextPtr(row.Door),
		CategoryID: dbutil.UUIDStrPtr(row.CategoryID),
	}
	if row.CategoryIDJoined.Valid {
		b.Category = &BookableCategory{
			ID:     dbutil.UUIDStr(row.CategoryIDJoined),
			Name:   row.CategoryNameSv.String,
			NameSv: row.CategoryNameSv.String,
			NameEn: dbutil.TextPtr(row.CategoryNameEn),
		}
	}
	return b
}

// bookableNoCategoryRow adapts the plain (non-joined) bookable row shape
// used by Create/Update's own RETURNING and by the booking-request join
// query - no category sub-object, matching the "nested object only where
// a real consumer needs it" precedent noted on Bookable.Category above.
type bookableNoCategoryRow struct {
	ID         pgtype.UUID
	NameSv     string
	NameEn     pgtype.Text
	IsDisabled bool
	Door       pgtype.Text
	CategoryID pgtype.UUID
}

func toBookableNoCategory(row bookableNoCategoryRow) Bookable {
	return Bookable{
		ID:         dbutil.UUIDStr(row.ID),
		Name:       row.NameSv,
		NameSv:     row.NameSv,
		NameEn:     dbutil.TextPtr(row.NameEn),
		IsDisabled: row.IsDisabled,
		Door:       dbutil.TextPtr(row.Door),
		CategoryID: dbutil.UUIDStrPtr(row.CategoryID),
	}
}

// bookerRow adapts the booker-member columns shared by every joined
// booking-request row type (Get/List/ListConflicting) - member.id is only
// valid when booker_id is set (the LEFT JOIN produces all-NULL columns for
// an unset booker), so a nil *apitypes.Member is the honest result then.
type bookerRow struct {
	BookerMemberID    pgtype.UUID
	BookerStudentID   pgtype.Text
	BookerFirstName   pgtype.Text
	BookerLastName    pgtype.Text
	BookerNickname    pgtype.Text
	BookerPicturePath pgtype.Text
}

func toBooker(row bookerRow) *apitypes.Member {
	if !row.BookerMemberID.Valid {
		return nil
	}
	return &apitypes.Member{
		ID:          dbutil.UUIDStr(row.BookerMemberID),
		StudentID:   dbutil.TextPtr(row.BookerStudentID),
		FirstName:   dbutil.TextPtr(row.BookerFirstName),
		LastName:    dbutil.TextPtr(row.BookerLastName),
		Nickname:    dbutil.TextPtr(row.BookerNickname),
		PicturePath: dbutil.TextPtr(row.BookerPicturePath),
	}
}

// bookingRequestRow adapts the shared booking_requests-plus-booker column
// shape (GetBookingRequestByIDRow, ListUpcomingBookingRequestsRow,
// ListConflictingBookingRequestsRow all share it structurally).
type bookingRequestRow struct {
	ID       pgtype.UUID
	BookerID pgtype.UUID
	Start    pgtype.Timestamptz
	End      pgtype.Timestamptz
	Created  pgtype.Timestamptz
	Event    pgtype.Text
	Status   db.BookingRequestStatus
	bookerRow
}

func toBookingRequest(row bookingRequestRow) BookingRequest {
	return BookingRequest{
		ID:        dbutil.UUIDStr(row.ID),
		Event:     dbutil.TextPtr(row.Event),
		Start:     dbutil.TimePtr(row.Start),
		End:       dbutil.TimePtr(row.End),
		Created:   dbutil.TimePtr(row.Created),
		Status:    string(row.Status),
		Booker:    toBooker(row.bookerRow),
		Bookables: []Bookable{},
	}
}

func orEmptyBookables(bookables []Bookable) []Bookable {
	if bookables == nil {
		return []Bookable{}
	}
	return bookables
}
