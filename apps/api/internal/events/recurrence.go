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

// All recurrence math works on Stockholm calendar dates and wall-clock
// times, and only turns them back into instants at the very end - the same
// approach as upstream's src/lib/events/recurrence.ts (#1322), which this
// file mirrors. time.Date with a real *time.Location resolves a wall-clock
// time on a given date correctly across DST, so no offset math is needed.

// civilDate is a calendar date with no time or offset.
type civilDate struct {
	Year  int
	Month time.Month
	Day   int
}

// wallClock is a time of day with no date or offset.
type wallClock struct {
	Hour, Min, Sec, Nsec int
}

func toWallClock(t time.Time, loc *time.Location) (civilDate, wallClock) {
	local := t.In(loc)
	y, m, d := local.Date()
	h, mi, sec := local.Clock()
	return civilDate{y, m, d}, wallClock{h, mi, sec, local.Nanosecond()}
}

func (d civilDate) at(c wallClock, loc *time.Location) time.Time {
	return time.Date(d.Year, d.Month, d.Day, c.Hour, c.Min, c.Sec, c.Nsec, loc)
}

func (d civilDate) before(o civilDate) bool {
	return d.Year < o.Year ||
		d.Year == o.Year && (d.Month < o.Month || d.Month == o.Month && d.Day < o.Day)
}

func (d civilDate) addDays(n int) civilDate {
	t := time.Date(d.Year, d.Month, d.Day+n, 0, 0, 0, 0, time.UTC)
	return civilDate{t.Year(), t.Month(), t.Day()}
}

// addMonths adds n months, clamping to the target month's last day (Jan 31
// + 1 month = Feb 28/29) the way dayjs's add(n, "month") does, instead of
// overflowing into the following month like time.AddDate.
func (d civilDate) addMonths(n int) civilDate {
	first := time.Date(d.Year, d.Month+time.Month(n), 1, 0, 0, 0, 0, time.UTC)
	lastDay := first.AddDate(0, 1, -1).Day()
	return civilDate{first.Year(), first.Month(), min(d.Day, lastDay)}
}

func daysBetween(from, to civilDate) int {
	a := time.Date(from.Year, from.Month, from.Day, 0, 0, 0, 0, time.UTC)
	b := time.Date(to.Year, to.Month, to.Day, 0, 0, 0, 0, time.UTC)
	return int(b.Sub(a).Hours() / 24)
}

// template is the wall-clock shape of an event: when it starts, when it
// ends, and how many whole calendar days later the end falls (so overnight
// events stay overnight).
type template struct {
	startDate    civilDate
	start, end   wallClock
	endDayOffset int
}

func toTemplate(start, end time.Time, loc *time.Location) template {
	startDate, startClock := toWallClock(start, loc)
	endDate, endClock := toWallClock(end, loc)
	return template{
		startDate:    startDate,
		start:        startClock,
		end:          endClock,
		endDayOffset: daysBetween(startDate, endDate),
	}
}

func (t template) placeOn(d civilDate, loc *time.Location) occurrence {
	return occurrence{
		Start: d.at(t.start, loc),
		End:   d.addDays(t.endDayOffset).at(t.end, loc),
	}
}

// expandOccurrences computes every occurrence's (start, end) pair for a
// recurring series: step by (separationCount+1) units of recurringType from
// templateStart's Stockholm date, through any occurrence whose date is on
// or before seriesEnd's Stockholm date (inclusive of that day, however
// early in it seriesEnd falls). Every occurrence keeps the template's
// wall-clock start/end time and its start-to-end day offset.
func expandOccurrences(
	templateStart, templateEnd, seriesEnd time.Time,
	separationCount int,
	recurringType string,
) ([]occurrence, error) {
	loc, err := time.LoadLocation(stockholmTZ)
	if err != nil {
		return nil, fmt.Errorf("load %s: %w", stockholmTZ, err)
	}
	step := max(separationCount+1, 1)

	tmpl := toTemplate(templateStart, templateEnd, loc)
	lastDate, _ := toWallClock(seriesEnd, loc)

	var occurrences []occurrence
	for d := tmpl.startDate; !lastDate.before(d); {
		occurrences = append(occurrences, tmpl.placeOn(d, loc))
		if len(occurrences) > maxOccurrences {
			return nil, invalidf(
				"recurring series would generate more than %d occurrences",
				maxOccurrences,
			)
		}

		switch recurringType {
		case "DAILY":
			d = d.addDays(step)
		case "WEEKLY":
			d = d.addDays(7 * step)
		case "MONTHLY":
			d = d.addMonths(step)
		case "YEARLY":
			d = d.addMonths(12 * step)
		default:
			return nil, invalidf("unknown recurring type %q", recurringType)
		}
	}
	return occurrences, nil
}

// retimeOccurrence moves an existing occurrence to newStart/newEnd's
// Stockholm wall-clock times, keeping it on its own start date - the
// per-sibling half of a Future/All series edit (see Update's doc comment).
// The end is placed by newStart/newEnd's day offset, not the occurrence's
// old end date, so retiming a same-day occurrence into an overnight one
// (or back) keeps the end after the start.
func retimeOccurrence(
	existingStart, newStart, newEnd time.Time,
) (time.Time, time.Time, error) {
	loc, err := time.LoadLocation(stockholmTZ)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("load %s: %w", stockholmTZ, err)
	}
	date, _ := toWallClock(existingStart, loc)
	o := toTemplate(newStart, newEnd, loc).placeOn(date, loc)
	return o.Start, o.End, nil
}
