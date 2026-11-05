package booking

import (
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/backend/internal/apitypes"
)

type BookableCategory struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	NameSv string  `json:"nameSv"`
	NameEn *string `json:"nameEn,omitempty"`
}

type BookableCategoryInput struct {
	NameSv string  `json:"nameSv"`
	NameEn *string `json:"nameEn,omitempty"`
}

type Bookable struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	NameSv     string  `json:"nameSv"`
	NameEn     *string `json:"nameEn,omitempty"`
	IsDisabled bool    `json:"isDisabled"           doc:"Disabled bookables can't be booked."`
	Door       *string `json:"door,omitempty"       doc:"The door to the bookable, so a booking can grant access to it."`
	CategoryID *string `json:"categoryId,omitempty"`
	// Category is only populated by List/Get (a joined read), nil on
	// Create/Update's own RETURNING - same "nested object only where a real
	// consumer needs it" pattern as apitypes.Position.Committee.
	Category *BookableCategory `json:"category,omitempty" doc:"Only on GET."`
}

type BookableInput struct {
	NameSv     string  `json:"nameSv"`
	NameEn     *string `json:"nameEn,omitempty"`
	IsDisabled bool    `json:"isDisabled"`
	Door       *string `json:"door,omitempty"       doc:"Must be an existing door's name."`
	CategoryID *string `json:"categoryId,omitempty"`
}

// BookingRequestStatus mirrors the old Prisma enum's three values exactly.
type BookingRequestStatus string

const (
	StatusPending  BookingRequestStatus = "PENDING"
	StatusAccepted BookingRequestStatus = "ACCEPTED"
	StatusDenied   BookingRequestStatus = "DENIED"
)

func (BookingRequestStatus) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "BookingRequestStatus", "PENDING", "ACCEPTED", "DENIED")
}

// BookingRequest's start/end/event/booker are nullable in the underlying
// table (a historical looseness) even though every
// real code path always sets them; kept as pointers to reflect that
// honestly rather than assume NOT NULL.
type BookingRequest struct {
	ID        string               `json:"id"`
	Event     *string              `json:"event,omitempty"   doc:"What the booking is for."`
	Start     *time.Time           `json:"start,omitempty"`
	End       *time.Time           `json:"end,omitempty"`
	Created   *time.Time           `json:"created,omitempty"`
	Status    BookingRequestStatus `json:"status"`
	Booker    *apitypes.Member     `json:"booker,omitempty"  doc:"Who asked for the booking."`
	Bookables []Bookable           `json:"bookables"`
	// AccessDoors/AccessMembers are the doors the booker asked to have
	// opened for the booking and who should get in (upstream #1184).
	// Accepting the request grants exactly that door access, for the
	// booking's time plus a buffer (see Service.SetStatus).
	AccessDoors   []BookingDoor     `json:"accessDoors"   doc:"Doors to open for the booking."`
	AccessMembers []apitypes.Member `json:"accessMembers" doc:"Members who get door access for the booking."`
}

type BookingDoor struct {
	Name        string `json:"name"        doc:"The door's internal name."`
	VerboseName string `json:"verboseName" doc:"Display name."`
}

// BookingReviewItem is a pending request in the admin review queue, with the
// other active requests it collides with.
type BookingReviewItem struct {
	BookingRequest
	Conflicts []BookingRequest `json:"conflicts" doc:"Other active requests for the same bookables that overlap in time."`
}

// BookingRequestResult is a saved booking request and the requests it
// overlaps.
type BookingRequestResult struct {
	BookingRequest BookingRequest   `json:"bookingRequest"`
	Conflicts      []BookingRequest `json:"conflicts"      doc:"Other non-denied requests for the same bookables that overlap in time. A warning only; the request is saved."`
}

// BookingAccessInput replaces a request's door-access lists (door names, member
// ids).
type BookingAccessInput struct {
	AccessDoors     []string `json:"accessDoors"     doc:"Door names."`
	AccessMemberIDs []string `json:"accessMemberIds" doc:"Member ids (UUIDs)."`
}

type BookingRequestInput struct {
	Event       string    `json:"event"       doc:"What the booking is for."`
	Start       time.Time `json:"start"`
	End         time.Time `json:"end"`
	BookableIDs []string  `json:"bookableIds"`
	BookingAccessInput
}
