package articles

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/dsek-lth/web/backend/internal/integrations"
)

type fakeScheduler struct{ scheduled, cancelled int }

func (f *fakeScheduler) Schedule(
	context.Context,
	integrations.ArticleNotification,
	time.Time,
) (string, error) {
	f.scheduled++
	return "", errors.New("fakeScheduler: not used by these tests")
}

func (f *fakeScheduler) Cancel(context.Context, string) error {
	f.cancelled++
	return nil
}

type fakeAnnouncer struct {
	calls int
	err   error
}

func (f *fakeAnnouncer) NotifyNewArticle(context.Context, integrations.ArticleNotification) error {
	f.calls++
	return f.err
}

// fakeNotifier only implements what syncNotifications calls.
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

func newTestService() (*Service, *fakeScheduler, *fakeNotifier, *fakeAnnouncer) {
	sched, notifier, webhooker := &fakeScheduler{}, &fakeNotifier{}, &fakeAnnouncer{}
	return &Service{scheduler: sched, notifier: notifier, webhooker: webhooker},
		sched, notifier, webhooker
}

func at(d time.Duration) *time.Time {
	t := time.Now().Add(d)
	return &t
}

func TestPublishingNowAnnounces(t *testing.T) {
	s, _, notifier, webhooker := newTestService()
	in := ArticleInput{ShouldSendNotification: true, PublishedAt: at(0)}
	announced, err := s.syncNotifications(
		context.Background(),
		"a",
		"",
		"",
		"",
		in,
		previousState{},
	)
	if err != nil || !announced {
		t.Fatalf("announced=%v err=%v", announced, err)
	}
	if notifier.calls != 1 || webhooker.calls != 1 {
		t.Errorf("notifier=%d webhooker=%d, want 1 each", notifier.calls, webhooker.calls)
	}
}

func TestEditingALiveArticleNeverAnnounces(t *testing.T) {
	s, sched, notifier, webhooker := newTestService()
	prev := previousState{publishedAt: at(-time.Hour)}
	for _, publishAt := range []*time.Time{at(-time.Hour), at(time.Hour)} {
		in := ArticleInput{ShouldSendNotification: true, PublishedAt: publishAt}
		if _, err := s.syncNotifications(
			context.Background(),
			"a",
			"",
			"",
			"",
			in,
			prev,
		); err != nil {
			t.Fatal(err)
		}
	}
	if notifier.calls+webhooker.calls+sched.scheduled != 0 {
		t.Errorf("notifier=%d webhooker=%d scheduled=%d, want nothing",
			notifier.calls, webhooker.calls, sched.scheduled)
	}
}

func TestOneFailedChannelDoesNotSkipTheOther(t *testing.T) {
	s, _, notifier, webhooker := newTestService()
	notifier.err = errors.New("push down")
	in := ArticleInput{ShouldSendNotification: true, PublishedAt: at(0)}
	announced, err := s.syncNotifications(
		context.Background(),
		"a",
		"",
		"",
		"",
		in,
		previousState{},
	)
	if err != nil {
		t.Fatalf("a failed announcement must not fail the save: %v", err)
	}
	if announced {
		t.Error("announced should be false")
	}
	if webhooker.calls != 1 {
		t.Error("the Discord post should still be attempted")
	}
}
