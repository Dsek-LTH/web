package medals

import (
	"sort"
	"time"

	"github.com/dsek-lth/web/backend/internal/semesters"
)

// mandateInfo is the minimal shape the award rules need from a mandate -
// its covered date range, whether the position is a board position, and
// which committee (if any) it belongs to. Ported faithfully from
// src/lib/server/medals/medals.ts.
type mandateInfo struct {
	Start       time.Time
	End         time.Time
	BoardMember bool
	CommitteeID *string
}

// coveredSemesters unions the semesters covered by a set of mandates,
// sorted ascending - mirrors getSemesters.
func coveredSemesters(mandates []mandateInfo) []semesters.Semester {
	set := map[semesters.Semester]bool{}
	for _, m := range mandates {
		for _, s := range semesters.Covered(m.Start, m.End) {
			set[s] = true
		}
	}
	out := make([]semesters.Semester, 0, len(set))
	for s := range set {
		out = append(out, s)
	}
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out
}

func filterAtMost(sems []semesters.Semester, after semesters.Semester) []semesters.Semester {
	out := make([]semesters.Semester, 0, len(sems))
	for _, s := range sems {
		if s <= after {
			out = append(out, s)
		}
	}
	return out
}

// volunteerMedalSemester mirrors volunteerMedalSemester: awarded after the
// 2nd distinct semester volunteered (sems is already sorted ascending).
func volunteerMedalSemester(sems []semesters.Semester) (semesters.Semester, bool) {
	if len(sems) < 2 {
		return 0, false
	}
	return sems[1], true
}

// committeeMedalSemester mirrors committeeMedalSemester: awarded after the
// 6th distinct semester volunteered for that committee.
func committeeMedalSemester(sems []semesters.Semester) (semesters.Semester, bool) {
	if len(sems) < 6 {
		return 0, false
	}
	return sems[5], true
}

// gammalOchAcklig mirrors gammalOchÄckligSemester: needs >=8 total
// volunteer semesters, or >=6 volunteer + >=2 board semesters. Awarding
// semester is the min(7, max(index of the 2nd board semester in sorted
// volunteer semesters, 5))-th sorted volunteer semester, or the 8th
// (index 7) if fewer than 2 board semesters.
func gammalOchAcklig(board, volunteer []semesters.Semester) (semesters.Semester, bool) {
	if !(len(volunteer) >= 8 || (len(volunteer) >= 6 && len(board) >= 2)) {
		return 0, false
	}
	var at int
	if len(board) < 2 {
		at = 7
	} else {
		idx := indexOf(volunteer, board[1])
		at = idx
		if at < 5 {
			at = 5
		}
		if at > 7 {
			at = 7
		}
	}
	if at < 0 || at >= len(volunteer) {
		return 0, false
	}
	return volunteer[at], true
}

func indexOf(s []semesters.Semester, v semesters.Semester) int {
	for i, x := range s {
		if x == v {
			return i
		}
	}
	return -1
}
