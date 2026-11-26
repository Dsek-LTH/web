package members

import (
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func TestBirthdayOn(t *testing.T) {
	date := func(y int, m time.Month, d int) pgtype.Date {
		return pgtype.Date{Time: time.Date(y, m, d, 0, 0, 0, 0, time.UTC), Valid: true}
	}
	for _, tc := range []struct {
		name  string
		birth pgtype.Date
		now   time.Time
		want  bool
	}{
		{"no birth date", pgtype.Date{}, time.Date(2026, 5, 4, 12, 0, 0, 0, time.UTC), false},
		{"same day", date(2000, 5, 4), time.Date(2026, 5, 4, 12, 0, 0, 0, time.UTC), true},
		{"other day", date(2000, 5, 4), time.Date(2026, 5, 5, 12, 0, 0, 0, time.UTC), false},
		// 22:30 UTC on 3 May is already 4 May in Stockholm.
		{"Swedish date, not UTC", date(2000, 5, 4), time.Date(2026, 5, 3, 22, 30, 0, 0, time.UTC), true},
		{"29 Feb in a leap year", date(2000, 2, 29), time.Date(2028, 2, 29, 12, 0, 0, 0, time.UTC), true},
		{"29 Feb on 1 Mar otherwise", date(2000, 2, 29), time.Date(2026, 3, 1, 12, 0, 0, 0, time.UTC), true},
		{"29 Feb not on 28 Feb", date(2000, 2, 29), time.Date(2026, 2, 28, 12, 0, 0, 0, time.UTC), false},
	} {
		if got := BirthdayOn(tc.birth, tc.now); got != tc.want {
			t.Errorf("%s: birthdayOn = %v, want %v", tc.name, got, tc.want)
		}
	}
}
