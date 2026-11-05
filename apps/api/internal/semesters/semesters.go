// Package semesters ports src/lib/utils/semesters.ts's academic-semester
// encoding verbatim - a semester is 2*year (spring, "VT") or 2*year+1
// (fall, "HT"), which sorts correctly as a plain integer. Used by
// internal/medals, whose award rules are all expressed in terms of
// distinct semesters volunteered, not calendar dates.
package semesters

import (
	"fmt"
	"regexp"
	"strconv"
	"time"
)

type Semester int32

func FromYearAndTerm(year int, term string) Semester {
	s := Semester(year * 2)
	if term == "HT" {
		s++
	}
	return s
}

func Year(s Semester) int { return int(s) / 2 }

func isSpring(s Semester) bool { return s%2 == 0 }

func Term(s Semester) string {
	if isSpring(s) {
		return "VT"
	}
	return "HT"
}

// StartDate mirrors semesters.ts's startDate: VT starts Jan 1, HT starts
// Jul 1, in local time (matching the old app's plain `new Date(year,
// month, 1)` - no explicit timezone, same ambiguity carried over).
func StartDate(s Semester) time.Time {
	month := time.January
	if !isSpring(s) {
		month = time.July
	}
	return time.Date(Year(s), month, 1, 0, 0, 0, 0, time.Local)
}

// EndDate mirrors semesters.ts's endDate: VT ends Jul 1 (exclusive), HT
// ends Jan 1 of the following year (exclusive).
func EndDate(s Semester) time.Time {
	if isSpring(s) {
		return time.Date(Year(s), time.July, 1, 0, 0, 0, 0, time.Local)
	}
	return time.Date(Year(s)+1, time.January, 1, 0, 0, 0, 0, time.Local)
}

// FromDate mirrors dateToSemester: month is 0-indexed in JS (>= 6 means
// Jul+), Go's time.Month is 1-indexed, so the equivalent cutoff is >= 7.
func FromDate(t time.Time) Semester {
	s := Semester(t.Year() * 2)
	if t.Month() >= time.July {
		s++
	}
	return s
}

func Range(start, end Semester) []Semester {
	if end < start {
		return nil
	}
	out := make([]Semester, 0, end-start+1)
	for s := start; s <= end; s++ {
		out = append(out, s)
	}
	return out
}

// Covered mirrors coveredSemesters: every semester between the two dates'
// semesters, inclusive, deduplicated.
func Covered(start, end time.Time) []Semester {
	return Range(FromDate(start), FromDate(end))
}

func String(s Semester) string {
	return fmt.Sprintf("%s %d", Term(s), Year(s))
}

var pattern = regexp.MustCompile(`^(VT|HT) (\d{4})$`)

func Parse(s string) (Semester, error) {
	m := pattern.FindStringSubmatch(s)
	if m == nil {
		return 0, fmt.Errorf("invalid semester %q", s)
	}
	year, err := strconv.Atoi(m[2])
	if err != nil {
		return 0, fmt.Errorf("invalid semester %q", s)
	}
	return FromYearAndTerm(year, m[1]), nil
}
