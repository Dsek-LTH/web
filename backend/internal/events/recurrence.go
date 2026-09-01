package events

import (
	"fmt"
	"time"
)

const stockholmTZ = "Europe/Stockholm"

// maxOccurrences caps how many rows a single recurring-event create can
// materialize - a safety valve against a pathological input (e.g. DAILY
// with a huge date range) that the old TS code's unbounded while loop
// didn't have.
const maxOccurrences = 366

type occurrence struct {
	Start time.Time
	End   time.Time
}

// expandOccurrences computes every occurrence's (start, end) pair for a
// recurring series, mirroring src/lib/events/server/actions.ts's
// createEvent: step by (separationCount+1) units of recurringType,
// starting at templateStart/templateEnd and continuing through any
// occurrence whose date is on or before seriesEnd's calendar date
// (inclusive of that day). Each occurrence keeps the template's wall-clock
// start/end time-of-day and the template's start/end day offset (so a
// multi-day event's occurrences stay multi-day), reconstructed in
// Europe/Stockholm so the wall-clock time survives DST transitions exactly
// like the old dayjs.tz(...).hour(...).minute(...) code - Go's time.Date
// does this correctly for a given date when handed a real *time.Location,
// no manual offset math needed.
func expandOccurrences(
	templateStart, templateEnd, seriesEnd time.Time,
	separationCount int,
	recurringType string,
) ([]occurrence, error) {
	loc, err := time.LoadLocation(stockholmTZ)
	if err != nil {
		return nil, fmt.Errorf("load %s: %w", stockholmTZ, err)
	}
	step := separationCount + 1
	if step < 1 {
		step = 1
	}

	startLocal := templateStart.In(loc)
	endLocal := templateEnd.In(loc)
	seriesEndLocal := seriesEnd.In(loc)
	sh, sm, ss := startLocal.Clock()
	eh, em, es := endLocal.Clock()
	dayOffset := dateOnly(endLocal).Sub(dateOnly(startLocal))

	var occurrences []occurrence
	for d := startLocal; !dateOnly(d).After(dateOnly(seriesEndLocal)); {
		occStart := time.Date(
			d.Year(),
			d.Month(),
			d.Day(),
			sh,
			sm,
			ss,
			startLocal.Nanosecond(),
			loc,
		)
		endDate := d.Add(dayOffset)
		occEnd := time.Date(
			endDate.Year(), endDate.Month(), endDate.Day(),
			eh, em, es, endLocal.Nanosecond(), loc,
		)
		occurrences = append(occurrences, occurrence{Start: occStart, End: occEnd})
		if len(occurrences) > maxOccurrences {
			return nil, invalidf(
				"recurring series would generate more than %d occurrences",
				maxOccurrences,
			)
		}

		switch recurringType {
		case "DAILY":
			d = d.AddDate(0, 0, step)
		case "WEEKLY":
			d = d.AddDate(0, 0, 7*step)
		case "MONTHLY":
			d = d.AddDate(0, step, 0)
		case "YEARLY":
			d = d.AddDate(step, 0, 0)
		default:
			return nil, invalidf("unknown recurring type %q", recurringType)
		}
	}
	return occurrences, nil
}

func dateOnly(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
}
