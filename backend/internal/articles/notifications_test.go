package articles

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/joho/godotenv"

	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/integrations"
)

// These tests run against the dev database (POSTGRES_URL, falling back to
// the repo's .env), inside a transaction that is rolled back, and are
// skipped when no database is reachable.

type fakeAnnouncer struct {
	calls int
	err   error
}

func (f *fakeAnnouncer) NotifyNewArticle(context.Context, integrations.ArticleNotification) error {
	f.calls++
	return f.err
}

// fakeNotifier only implements what announcing calls.
type fakeNotifier struct {
	integrations.Notifier
	fakeAnnouncer
}

func (f *fakeNotifier) NotifyNewArticle(
	ctx context.Context,
	n integrations.ArticleNotification,
) error {
	return f.fakeAnnouncer.NotifyNewArticle(ctx, n)
}

type harness struct {
	t         *testing.T
	tx        pgx.Tx
	svc       *Service
	notifier  *fakeNotifier
	webhooker *fakeAnnouncer
	authorID  pgtype.UUID
}

func newHarness(t *testing.T) *harness {
	t.Helper()
	_ = godotenv.Load("../../../.env")
	dsn := os.Getenv("POSTGRES_URL")
	if dsn == "" {
		t.Skip("POSTGRES_URL not set")
	}
	ctx := context.Background()
	pool, err := db.NewPool(ctx, dsn)
	if err != nil {
		t.Skipf("database unreachable: %v", err)
	}
	t.Cleanup(pool.Close)
	if err := pool.Ping(ctx); err != nil {
		t.Skipf("database unreachable: %v", err)
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = tx.Rollback(context.Background()) })

	h := &harness{t: t, tx: tx, notifier: &fakeNotifier{}, webhooker: &fakeAnnouncer{}}
	h.svc = &Service{queries: db.New(tx), notifier: h.notifier, webhooker: h.webhooker}
	if err := tx.QueryRow(ctx, "SELECT id FROM authors LIMIT 1").Scan(&h.authorID); err != nil {
		t.Skipf("no author to attach test articles to: %v", err)
	}
	return h
}

// article inserts an article with announced_at NULL, as a save leaves it.
func (h *harness) article(publishedAt time.Time, wantsNotification bool) pgtype.UUID {
	h.t.Helper()
	var id pgtype.UUID
	err := h.tx.QueryRow(context.Background(), `
		INSERT INTO articles (header_sv, body_sv, author_id, published_datetime,
		                      should_send_notification, slug)
		VALUES ('Test', 'Body', $1, $2, $3, 'announce-test-' || gen_random_uuid())
		RETURNING id`, h.authorID, publishedAt, wantsNotification).Scan(&id)
	if err != nil {
		h.t.Fatal(err)
	}
	return id
}

func (h *harness) announced(id pgtype.UUID) bool {
	h.t.Helper()
	var at pgtype.Timestamptz
	err := h.tx.QueryRow(context.Background(),
		"SELECT announced_at FROM articles WHERE id = $1", id).Scan(&at)
	if err != nil {
		h.t.Fatal(err)
	}
	return at.Valid
}

func (h *harness) sync(id pgtype.UUID, in ArticleInput, prev previousState) bool {
	h.t.Helper()
	announced, err := h.svc.syncNotifications(
		context.Background(), "test", dbutil.UUIDStr(id), "", "", in, prev)
	if err != nil {
		h.t.Fatal(err)
	}
	return announced
}

func (h *harness) sweep() {
	h.t.Helper()
	if err := h.svc.AnnounceDue(context.Background()); err != nil {
		h.t.Fatal(err)
	}
}

func ptr(t time.Time) *time.Time { return &t }

func TestPublishingNowAnnouncesOnce(t *testing.T) {
	h := newHarness(t)
	now := time.Now()
	id := h.article(now.Add(-time.Second), true)
	if !h.sync(
		id,
		ArticleInput{ShouldSendNotification: true, PublishedAt: ptr(now)},
		previousState{},
	) {
		t.Error("announced should be true")
	}
	h.sweep()
	if h.notifier.calls != 1 || h.webhooker.calls != 1 {
		t.Errorf("notifier=%d webhooker=%d, want 1 each", h.notifier.calls, h.webhooker.calls)
	}
}

func TestFutureArticleIsAnnouncedByTheSweep(t *testing.T) {
	h := newHarness(t)
	future := time.Now().Add(time.Hour)
	id := h.article(future, true)
	h.sync(id, ArticleInput{ShouldSendNotification: true, PublishedAt: &future}, previousState{})
	h.sweep()
	if h.notifier.calls != 0 || h.announced(id) {
		t.Fatal("a future article must not be announced before it goes live")
	}

	// Its time comes.
	if _, err := h.tx.Exec(context.Background(),
		"UPDATE articles SET published_datetime = now() - interval '1 minute' WHERE id = $1", id,
	); err != nil {
		t.Fatal(err)
	}
	h.sweep()
	h.sweep()
	if h.notifier.calls != 1 || h.webhooker.calls != 1 || !h.announced(id) {
		t.Errorf("notifier=%d webhooker=%d announced=%v, want one announcement",
			h.notifier.calls, h.webhooker.calls, h.announced(id))
	}
}

func TestEditingALiveArticleNeverAnnounces(t *testing.T) {
	h := newHarness(t)
	past := time.Now().Add(-10 * time.Minute)
	id := h.article(past, false)
	prev := previousState{publishedAt: &past}
	for _, publishAt := range []time.Time{past, time.Now().Add(time.Hour)} {
		h.sync(id, ArticleInput{ShouldSendNotification: true, PublishedAt: ptr(publishAt)}, prev)
	}
	h.sweep()
	if h.notifier.calls+h.webhooker.calls != 0 || !h.announced(id) {
		t.Errorf("notifier=%d webhooker=%d announced=%v, want marked and silent",
			h.notifier.calls, h.webhooker.calls, h.announced(id))
	}
}

func TestFailedAnnouncementIsRetriedThenGivenUp(t *testing.T) {
	h := newHarness(t)
	h.notifier.err = errors.New("push down")
	now := time.Now()
	id := h.article(now.Add(-time.Second), true)
	if h.sync(
		id,
		ArticleInput{ShouldSendNotification: true, PublishedAt: ptr(now)},
		previousState{},
	) {
		t.Error("announced should be false when a channel fails")
	}
	if h.webhooker.calls != 1 {
		t.Error("the Discord post should still be attempted")
	}
	if h.announced(id) {
		t.Fatal("a failed announcement should be released for a retry")
	}

	h.sweep()
	if h.notifier.calls != 2 {
		t.Errorf("notifier=%d, want the sweep to retry", h.notifier.calls)
	}

	// Still failing past the retry window: marked without another attempt.
	if _, err := h.tx.Exec(context.Background(),
		"UPDATE articles SET published_datetime = now() - interval '2 hours' WHERE id = $1", id,
	); err != nil {
		t.Fatal(err)
	}
	h.sweep()
	if h.notifier.calls != 2 || !h.announced(id) {
		t.Errorf("notifier=%d announced=%v, want given up", h.notifier.calls, h.announced(id))
	}
}
