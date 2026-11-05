package events

import (
	"testing"
	"time"
)

// Ported from upstream's src/lib/events/recurrence.test.ts (#1322). Inputs
// are given as RFC 3339 instants with an explicit offset, and results are
// read back as Stockholm wall-clock strings, so the tests don't depend on
// the DST math they check.

func at(t *testing.T, s string) time.Time {
	t.Helper()
	v, err := time.Parse(time.RFC3339, s)
	if err != nil {
		t.Fatal(err)
	}
	return v
}

func wall(t *testing.T, v time.Time) string {
	t.Helper()
	loc, err := time.LoadLocation(stockholmTZ)
	if err != nil {
		t.Fatal(err)
	}
	return v.In(loc).Format("2006-01-02 15:04")
}

func expand(
	t *testing.T, start, end, last string, step int, recurringType string,
) []occurrence {
	t.Helper()
	occ, err := expandOccurrences(at(t, start), at(t, end), at(t, last), step-1, recurringType)
	if err != nil {
		t.Fatal(err)
	}
	return occ
}

func assertWall(t *testing.T, got []time.Time, want []string) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("got %d occurrences, want %d", len(got), len(want))
	}
	for i := range got {
		if w := wall(t, got[i]); w != want[i] {
			t.Errorf("occurrence %d: got %s, want %s", i, w, want[i])
		}
	}
}

func starts(occ []occurrence) []time.Time {
	out := make([]time.Time, len(occ))
	for i, o := range occ {
		out[i] = o.Start
	}
	return out
}

func ends(occ []occurrence) []time.Time {
	out := make([]time.Time, len(occ))
	for i, o := range occ {
		out[i] = o.End
	}
	return out
}

func TestWeeklyAcrossDSTEnd(t *testing.T) {
	occ := expand(t,
		"2026-10-19T18:00:00+02:00", "2026-10-19T20:00:00+02:00",
		"2026-11-09T12:00:00+01:00", 1, "WEEKLY")
	assertWall(t, starts(occ), []string{
		"2026-10-19 18:00", "2026-10-26 18:00", "2026-11-02 18:00", "2026-11-09 18:00",
	})
	assertWall(t, ends(occ), []string{
		"2026-10-19 20:00", "2026-10-26 20:00", "2026-11-02 20:00", "2026-11-09 20:00",
	})
}

func TestWeeklyAcrossDSTStart(t *testing.T) {
	occ := expand(t,
		"2026-03-23T18:00:00+01:00", "2026-03-23T20:00:00+01:00",
		"2026-04-06T12:00:00+02:00", 1, "WEEKLY")
	assertWall(t, starts(occ), []string{
		"2026-03-23 18:00", "2026-03-30 18:00", "2026-04-06 18:00",
	})
}

// The day of the change itself is the tricky one: midnight and 18:00 have
// different offsets.
func TestDailyAroundDSTChange(t *testing.T) {
	for _, tc := range []struct{ name, first, last string }{
		{"DST end", "2026-10-22T18:00:00+02:00", "2026-10-28T12:00:00+01:00"},
		{"DST start", "2026-03-27T18:00:00+01:00", "2026-04-02T12:00:00+02:00"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			start := at(t, tc.first)
			occ, err := expandOccurrences(
				start, start.Add(2*time.Hour), at(t, tc.last), 0, "DAILY",
			)
			if err != nil {
				t.Fatal(err)
			}
			if len(occ) != 7 {
				t.Fatalf("got %d occurrences, want 7", len(occ))
			}
			for _, o := range occ {
				if w := wall(t, o.Start)[11:]; w != "18:00" {
					t.Errorf("start %s, want 18:00", w)
				}
				if w := wall(t, o.End)[11:]; w != "20:00" {
					t.Errorf("end %s, want 20:00", w)
				}
			}
		})
	}
}

func TestOvernightStaysOvernight(t *testing.T) {
	occ := expand(t,
		"2026-10-23T22:00:00+02:00", "2026-10-24T02:00:00+02:00",
		"2026-11-06T12:00:00+01:00", 1, "WEEKLY")
	assertWall(t, starts(occ), []string{
		"2026-10-23 22:00", "2026-10-30 22:00", "2026-11-06 22:00",
	})
	assertWall(t, ends(occ), []string{
		"2026-10-24 02:00", "2026-10-31 02:00", "2026-11-07 02:00",
	})
}

func TestSeparationCountIncludesLastDay(t *testing.T) {
	// Last day, but earlier in the day than the event.
	occ := expand(t,
		"2026-10-05T12:00:00+02:00", "2026-10-05T13:00:00+02:00",
		"2026-11-02T08:00:00+01:00", 2, "WEEKLY")
	assertWall(t, starts(occ), []string{
		"2026-10-05 12:00", "2026-10-19 12:00", "2026-11-02 12:00",
	})
}

func TestLastDayIsStockholmDate(t *testing.T) {
	// 2026-10-11T22:10Z: still the 11th in UTC.
	occ := expand(t,
		"2026-10-05T00:30:00+02:00", "2026-10-05T01:30:00+02:00",
		"2026-10-12T00:10:00+02:00", 1, "WEEKLY")
	assertWall(t, starts(occ), []string{"2026-10-05 00:30", "2026-10-12 00:30"})
}

// Not in upstream's test file: pins down the dayjs-style end-of-month
// clamping addMonths exists for.
func TestMonthlyClampsToMonthEnd(t *testing.T) {
	occ := expand(t,
		"2026-01-31T18:00:00+01:00", "2026-01-31T19:00:00+01:00",
		"2026-04-30T12:00:00+02:00", 1, "MONTHLY")
	assertWall(t, starts(occ), []string{
		"2026-01-31 18:00", "2026-02-28 18:00", "2026-03-28 18:00", "2026-04-28 18:00",
	})
}

func TestRetimeAcrossDST(t *testing.T) {
	// Occurrence on the DST-end day, retimed with a template from before it.
	start, end, err := retimeOccurrence(
		at(t, "2026-10-25T18:00:00+01:00"),
		at(t, "2026-10-19T19:30:00+02:00"),
		at(t, "2026-10-19T21:00:00+02:00"),
	)
	if err != nil {
		t.Fatal(err)
	}
	assertWall(t, []time.Time{start, end}, []string{"2026-10-25 19:30", "2026-10-25 21:00"})
}

func TestRetimeKeepsOvernightDuration(t *testing.T) {
	start, end, err := retimeOccurrence(
		at(t, "2026-11-06T22:00:00+01:00"),
		at(t, "2026-10-23T23:00:00+02:00"),
		at(t, "2026-10-24T03:00:00+02:00"),
	)
	if err != nil {
		t.Fatal(err)
	}
	assertWall(t, []time.Time{start, end}, []string{"2026-11-06 23:00", "2026-11-07 03:00"})
}
