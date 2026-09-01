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
// announce a new article. Real implementations will likely want more than
// this (resolved author/tag names, etc.) - extend as needed once one
// exists; the mocks ignore all of it.
type ArticleNotification struct {
	ArticleID        string
	Slug             string
	HeaderSv         string
	BodySv           string
	AuthorMemberID   string
	NotificationText string
	TagIDs           []string
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

// Notifier sends push notifications (e.g. to subscribed members' devices).
type Notifier interface {
	NotifyNewArticle(ctx context.Context, notification ArticleNotification) error
	NotifyLike(ctx context.Context, articleID, likedByMemberID, articleAuthorMemberID string) error
}

// Webhooker posts announcements to external chat systems (Discord).
type Webhooker interface {
	NotifyNewArticle(ctx context.Context, notification ArticleNotification) error
}

// Uploader stores a file and returns a URL it can be fetched from.
type Uploader interface {
	Upload(ctx context.Context, filename string, data io.Reader) (url string, err error)
}
