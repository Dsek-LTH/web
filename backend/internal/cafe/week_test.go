package cafe

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/dsek-lth/web/backend/internal/auth"
)

// The case from issue #1154: Monday 20 April 2026, 00:25 in Sweden, which
// is still Sunday (week 16) in UTC.
func TestWeeksFollowSwedishTime(t *testing.T) {
	mondayNight := time.Date(2026, 4, 20, 0, 25, 0, 0, stockholm)
	defer func(old func() time.Time) { now = old }(now)
	now = func() time.Time { return mondayNight.UTC() }

	ctx := auth.ContextWithIdentity(context.Background(), &auth.Identity{
		MemberID: "00000000-0000-0000-0000-000000000001",
	})
	year, week, err := resolveTargetWeek(ctx, nil, nil)
	if err != nil || year != 2026 || week != 17 {
		t.Fatalf("current week: got %d-W%d (%v), want 2026-W17", year, week, err)
	}
	for _, w := range []int32{17, 18, 19} {
		if _, _, err := resolveTargetWeek(ctx, ptr(int32(2026)), ptr(w)); err != nil {
			t.Errorf("week %d: %v, want it viewable", w, err)
		}
	}
	for _, w := range []int32{16, 20} {
		if _, _, err := resolveTargetWeek(
			ctx,
			ptr(int32(2026)),
			ptr(w),
		); !errors.Is(
			err,
			auth.ErrForbidden,
		) {
			t.Errorf("week %d: %v, want forbidden", w, err)
		}
	}

	if got, want := today(), time.Date(2026, 4, 20, 0, 0, 0, 0, time.UTC); !got.Equal(want) {
		t.Errorf("today: got %s, want %s", got.Format(time.DateOnly), want.Format(time.DateOnly))
	}
}

func ptr[T any](v T) *T { return &v }
