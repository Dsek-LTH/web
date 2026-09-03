// Package integrations declares the external systems article handling
// depends on but that aren't built in Go yet: scheduled publishing, push
// notifications, the Discord webhook, and image storage. Each is an
// interface with only a mock implementation (mock.go) for now - see
// ../../DESIGN.md's "Mocking out-of-scope dependencies" section for why
// that's the intended shape, not a shortcut.
package integrations

import (
	"context"
	"io"
	"time"
)

// ArticleNotification is what a Notifier/Webhooker/Scheduler needs to
// announce a new article. AuthorID is the authors.id used for the article's
// byline (added in Phase 9 for the real Notifier/Webhooker - see
// internal/notifications) - not necessarily a "self" author for
// AuthorMemberID, since an article can be posted under a mandate's byline.
type ArticleNotification struct {
	ArticleID        string
	Slug             string
	HeaderSv         string
	BodySv           string
	AuthorMemberID   string
	AuthorID         string
	NotificationText string
	TagIDs           []string
}

// LikeNotification is what Notifier.NotifyLike needs to announce a like -
// mirrors likesAction's sendNotification call.
type LikeNotification struct {
	ArticleID             string
	Slug                  string
	HeaderSv              string
	LikedByMemberID       string
	ArticleAuthorMemberID string
}

// EventNotification is what Notifier needs for an RSVP (going/interested)
// notification to an event's organizer - mirrors interestedGoing.ts's two
// sendNotification calls, closing the gap events.Service's own doc comment
// flags (see DESIGN.md's Phase 9 entry).
type EventNotification struct {
	EventID           string
	Slug              string
	TitleSv           string
	OrganizerMemberID string
	ActingMemberID    string
}

// Scheduler arranges for a future action (re-checking/notifying about an
// article at its scheduled publish time). It doesn't publish anything
// itself - internal/articles still owns the actual publish state via
// published_datetime; this is purely "call me back at runAt."
type Scheduler interface {
	// Schedule returns an opaque id the caller can pass to Cancel later, or
	// store for its own bookkeeping (see articles.Service.SetScheduledID).
	Schedule(
		ctx context.Context,
		notification ArticleNotification,
		runAt time.Time,
	) (scheduledID string, err error)
	Cancel(ctx context.Context, scheduledID string) error
}

// BookingRequestNotification is what a Notifier needs for booking's two
// notification points: a new request (to the building manager, "km
// mastare") and a status change (to the original booker). Status is only
// set for the latter - real implementations ignore fields they don't need,
// same as ArticleNotification above.
type BookingRequestNotification struct {
	BookingRequestID  string
	Event             string
	Start             time.Time
	End               time.Time
	BookableNames     []string
	RequesterMemberID string
	RecipientMemberID string
	Status            string
}

// Notifier sends push notifications (e.g. to subscribed members' devices).
type Notifier interface {
	NotifyNewArticle(ctx context.Context, notification ArticleNotification) error
	NotifyLike(ctx context.Context, notification LikeNotification) error
	NotifyNewBookingRequest(ctx context.Context, notification BookingRequestNotification) error
	NotifyBookingRequestStatus(ctx context.Context, notification BookingRequestNotification) error
	NotifyEventGoing(ctx context.Context, notification EventNotification) error
	NotifyEventInterested(ctx context.Context, notification EventNotification) error
}

// Webhooker posts announcements to external chat systems (Discord).
type Webhooker interface {
	NotifyNewArticle(ctx context.Context, notification ArticleNotification) error
}

// Uploader stores a file and returns a URL it can be fetched from.
type Uploader interface {
	Upload(ctx context.Context, filename string, data io.Reader) (url string, err error)
}
