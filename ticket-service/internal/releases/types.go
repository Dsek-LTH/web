package releases

import (
	"errors"
	"time"
)

var (
	ErrNotFound       = errors.New("release not found")
	ErrEntryNotFound  = errors.New("queue entry not found")
	ErrNotOpenYet     = errors.New("release is not open yet")
	ErrClosed         = errors.New("release is no longer accepting requests")
	ErrOfferNotActive = errors.New("no active offer to accept")
	ErrInvalidInput   = errors.New("invalid input")
)

const (
	ReleaseStatusScheduled   = "scheduled"
	ReleaseStatusLotteryDone = "lottery_done"

	EntryStatusPending    = "pending"
	EntryStatusGranted    = "granted"
	EntryStatusWaitlisted = "waitlisted"
	EntryStatusAccepted   = "accepted"
	EntryStatusExpired    = "expired"
	EntryStatusCancelled  = "cancelled"
)

type Release struct {
	ID                 string
	EventID            string
	Title              string
	Description        string
	Location           string
	Quantity           int
	OpensAt            time.Time
	ClosesAt           time.Time
	ExpiresAt          time.Time
	GraceWindowSeconds int
	OfferWindowSeconds int
	Status             string
	CreatedBy          string
	CreatedAt          time.Time
}

type QueueEntry struct {
	ID             string
	ReleaseID      string
	MemberID       string
	Status         string
	QueuePosition  *int
	OfferExpiresAt *time.Time
	RequestedAt    time.Time
	UpdatedAt      time.Time
}

// MemberEntry is a QueueEntry annotated with its release's title, for a
// member's "my tickets" view spanning every release they've touched.
type MemberEntry struct {
	QueueEntry
	ReleaseTitle string
}

type Counts struct {
	Quantity   int
	Claimed    int
	Waitlisted int
}

type CreateReleaseInput struct {
	EventID     string
	Title       string
	Description string
	Location    string
	Quantity    int
	OpensAt     time.Time
	ClosesAt    time.Time
	// ExpiresAt should be the linked event's end time - once it passes, the
	// release drops out of listings (rows are kept, never purged).
	ExpiresAt time.Time
	CreatedBy string
	// GraceWindowSeconds and OfferWindowSeconds default to 60 and 300 when zero.
	GraceWindowSeconds int
	OfferWindowSeconds int
}

// UpdateReleaseInput covers what's safe to change after publishing.
// EventID/OpensAt aren't editable: OpensAt already has an in-process lottery
// timer armed against it, and EventID drives ExpiresAt - both would need
// re-derivation logic this doesn't attempt yet.
type UpdateReleaseInput struct {
	Title       string
	Description string
	Location    string
	Quantity    int
	ClosesAt    time.Time
}
