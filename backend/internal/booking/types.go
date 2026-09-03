package booking

import (
	"time"

	"github.com/dsek-lth/web/backend/internal/apitypes"
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
	IsDisabled bool    `json:"isDisabled"`
	Door       *string `json:"door,omitempty"`
	CategoryID *string `json:"categoryId,omitempty"`
	// Category is only populated by List/Get (a joined read), nil on
	// Create/Update's own RETURNING - same "nested object only where a real
	// consumer needs it" pattern as apitypes.Position.Committee.
	Category *BookableCategory `json:"category,omitempty"`
}

type BookableInput struct {
	NameSv     string  `json:"nameSv"`
	NameEn     *string `json:"nameEn,omitempty"`
	IsDisabled bool    `json:"isDisabled"`
	Door       *string `json:"door,omitempty"`
	CategoryID *string `json:"categoryId,omitempty"`
}

// BookingRequestStatus mirrors the old Prisma enum's three values exactly.
type BookingRequestStatus string

const (
	StatusPending  BookingRequestStatus = "PENDING"
	StatusAccepted BookingRequestStatus = "ACCEPTED"
	StatusDenied   BookingRequestStatus = "DENIED"
)

// BookingRequest's start/end/event/booker are nullable in the underlying
// table (a historical looseness - see backend/CLAUDE.md) even though every
// real code path always sets them; kept as pointers to reflect that
// honestly rather than assume NOT NULL.
type BookingRequest struct {
	ID        string           `json:"id"`
	Event     *string          `json:"event,omitempty"`
	Start     *time.Time       `json:"start,omitempty"`
	End       *time.Time       `json:"end,omitempty"`
	Created   *time.Time       `json:"created,omitempty"`
	Status    string           `json:"status"`
	Booker    *apitypes.Member `json:"booker,omitempty"`
	Bookables []Bookable       `json:"bookables"`
}

type BookingRequestInput struct {
	Event       string    `json:"event"`
	Start       time.Time `json:"start"`
	End         time.Time `json:"end"`
	BookableIDs []string  `json:"bookableIds"`
}
