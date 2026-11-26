package integrations

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"io"
	"log/slog"
)

// MockNotifier never sends a push notification.
type MockNotifier struct{}

func (MockNotifier) NotifyNewArticle(_ context.Context, n ArticleNotification) error {
	slog.Info("integrations: mock notifier - pretending to notify subscribers", "slug", n.Slug)
	return nil
}

func (MockNotifier) NotifyLike(_ context.Context, n LikeNotification) error {
	slog.Info("integrations: mock notifier - pretending to notify about a like",
		"to", n.ArticleAuthorMemberID, "from", n.LikedByMemberID, "article_id", n.ArticleID)
	return nil
}

func (MockNotifier) NotifyNewBookingRequest(_ context.Context, n BookingRequestNotification) error {
	slog.Info("integrations: mock notifier - pretending to notify about a booking request",
		"to", n.RecipientMemberID, "booking_request_id", n.BookingRequestID)
	return nil
}

func (MockNotifier) NotifyBookingRequestStatus(
	_ context.Context,
	n BookingRequestNotification,
) error {
	slog.Info("integrations: mock notifier - pretending to notify about a booking status",
		"to", n.RecipientMemberID, "booking_request_id", n.BookingRequestID, "status", n.Status)
	return nil
}

func (MockNotifier) NotifyEventGoing(_ context.Context, n EventNotification) error {
	slog.Info("integrations: mock notifier - pretending to notify about going",
		"to", n.OrganizerMemberID, "from", n.ActingMemberID, "event_id", n.EventID)
	return nil
}

func (MockNotifier) NotifyEventInterested(_ context.Context, n EventNotification) error {
	slog.Info("integrations: mock notifier - pretending to notify about interest",
		"to", n.OrganizerMemberID, "from", n.ActingMemberID, "event_id", n.EventID)
	return nil
}

func (MockNotifier) NotifyPing(_ context.Context, n PingNotification) error {
	slog.Info("integrations: mock notifier - pretending to notify about a ping",
		"to", n.ToMemberID, "from", n.FromMemberID)
	return nil
}

// MockWebhooker never posts to Discord.
type MockWebhooker struct{}

func (MockWebhooker) NotifyNewArticle(_ context.Context, n ArticleNotification) error {
	slog.Info("integrations: mock webhooker - pretending to post to Discord", "slug", n.Slug)
	return nil
}

// MockUploader never stores anything - it returns an obviously-fake URL.
type MockUploader struct{}

func (MockUploader) Upload(_ context.Context, filename string, _ io.Reader) (string, error) {
	url := "https://mock-uploads.invalid/" + randomHex(8) + "-" + filename
	slog.Info("integrations: mock uploader - pretending to store", "file", filename, "url", url)
	return url, nil
}

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
