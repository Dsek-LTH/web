package integrations

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"io"
	"log"
	"time"
)

// MockScheduler never actually schedules anything - it fabricates a
// plausible-looking id so callers have something to store, and logs so
// it's obvious in dev output that nothing real happened.
type MockScheduler struct{}

func (MockScheduler) Schedule(
	_ context.Context,
	n ArticleNotification,
	runAt time.Time,
) (string, error) {
	id := "mock-" + randomHex(8)
	log.Printf(
		"integrations: mock scheduler - pretending to schedule %q for %s (id %s)",
		n.Slug, runAt.Format(time.RFC3339), id,
	)
	return id, nil
}

func (MockScheduler) Cancel(_ context.Context, scheduledID string) error {
	log.Printf("integrations: mock scheduler - pretending to cancel %s", scheduledID)
	return nil
}

// MockNotifier never sends a push notification.
type MockNotifier struct{}

func (MockNotifier) NotifyNewArticle(_ context.Context, n ArticleNotification) error {
	log.Printf("integrations: mock notifier - pretending to notify subscribers about %q", n.Slug)
	return nil
}

func (MockNotifier) NotifyLike(_ context.Context, n LikeNotification) error {
	log.Printf(
		"integrations: mock notifier - pretending to tell %s that %s liked article %s",
		n.ArticleAuthorMemberID, n.LikedByMemberID, n.ArticleID,
	)
	return nil
}

func (MockNotifier) NotifyNewBookingRequest(_ context.Context, n BookingRequestNotification) error {
	log.Printf(
		"integrations: mock notifier - pretending to tell %s about new booking request %q (%s)",
		n.RecipientMemberID, n.Event, n.BookingRequestID,
	)
	return nil
}

func (MockNotifier) NotifyBookingRequestStatus(
	_ context.Context,
	n BookingRequestNotification,
) error {
	log.Printf(
		"integrations: mock notifier - pretending to tell %s their booking request %q was %s",
		n.RecipientMemberID, n.Event, n.Status,
	)
	return nil
}

func (MockNotifier) NotifyEventGoing(_ context.Context, n EventNotification) error {
	log.Printf(
		"integrations: mock notifier - pretending to tell %s that %s is going to %q",
		n.OrganizerMemberID, n.ActingMemberID, n.TitleSv,
	)
	return nil
}

func (MockNotifier) NotifyEventInterested(_ context.Context, n EventNotification) error {
	log.Printf(
		"integrations: mock notifier - pretending to tell %s that %s is interested in %q",
		n.OrganizerMemberID, n.ActingMemberID, n.TitleSv,
	)
	return nil
}

// MockWebhooker never posts to Discord.
type MockWebhooker struct{}

func (MockWebhooker) NotifyNewArticle(_ context.Context, n ArticleNotification) error {
	log.Printf("integrations: mock webhooker - pretending to post %q to Discord", n.Slug)
	return nil
}

// MockUploader never stores anything - it returns an obviously-fake URL.
type MockUploader struct{}

func (MockUploader) Upload(_ context.Context, filename string, _ io.Reader) (string, error) {
	url := "https://mock-uploads.invalid/" + randomHex(8) + "-" + filename
	log.Printf("integrations: mock uploader - pretending to store %q, returning %s", filename, url)
	return url, nil
}

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
