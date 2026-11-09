// Package integrations declares the external systems article handling
// depends on: push notifications, the Discord webhook, and image storage.
// Each started out as an interface with only a mock implementation
// (mock.go), so callers could be written against the real shape first;
// the real implementations live in internal/notifications and
// internal/storage. (Scheduled publishing had a Scheduler interface here
// too; it was replaced by internal/articles' own announcement sweep.)
package integrations

import (
	"context"
	"io"
	"time"
)

// ArticleNotification is what a Notifier/Webhooker needs to
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
	// Nollning is whether the article belongs to a nollning season; those
	// aren't posted to Discord.
	Nollning bool
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
// sendNotification calls.
type EventNotification struct {
	EventID           string
	Slug              string
	TitleSv           string
	OrganizerMemberID string
	ActingMemberID    string
}

// BookingRequestNotification is what a Notifier needs for booking's two
// notification points: a new request (to the building manager, "km
// mastare") and a status change (to the original booker). Status is only
// set for the latter - real implementations ignore fields they don't need,
// same as ArticleNotification above.
type BookingRequestNotification struct {
	BookingRequestID string
	Event            string
	Start            time.Time
	End              time.Time
	BookableNames    []string
	// RequesterMemberID is who acted: the booker for a new request, the
	// reviewing admin for a status change (and so its sender).
	RequesterMemberID string
	RecipientMemberID string
	Status            string
}

// PingNotification is what Notifier.NotifyPing needs: who pinged whom, and
// the sender's student id for the link back to their profile.
type PingNotification struct {
	FromMemberID  string
	FromStudentID string
	ToMemberID    string
}

// Notifier sends push notifications (e.g. to subscribed members' devices).
type Notifier interface {
	NotifyNewArticle(ctx context.Context, notification ArticleNotification) error
	NotifyLike(ctx context.Context, notification LikeNotification) error
	NotifyNewBookingRequest(ctx context.Context, notification BookingRequestNotification) error
	NotifyBookingRequestStatus(ctx context.Context, notification BookingRequestNotification) error
	NotifyEventGoing(ctx context.Context, notification EventNotification) error
	NotifyEventInterested(ctx context.Context, notification EventNotification) error
	NotifyPing(ctx context.Context, notification PingNotification) error
}

// Webhooker posts announcements to external chat systems (Discord).
type Webhooker interface {
	NotifyNewArticle(ctx context.Context, notification ArticleNotification) error
}

// Uploader stores a file and returns a URL it can be fetched from.
type Uploader interface {
	Upload(ctx context.Context, filename string, data io.Reader) (url string, err error)
}
