package cafe

import (
	"time"

	"github.com/dsek-lth/web/backend/internal/apitypes"
)

type TimeSlot string

const (
	TimeSlotDayManager TimeSlot = "DAYMANAGER"
	TimeSlotShift1     TimeSlot = "SHIFT_1"
	TimeSlotShift2     TimeSlot = "SHIFT_2"
	TimeSlotShift3     TimeSlot = "SHIFT_3"
)

// OpeningHour is one "cafe:open*"-named markdowns row - see
// Service.ListOpeningHours. Ships both the raw markdownSv/markdownEn pair
// and one resolved markdown field, same pattern as Election/Alert.
type OpeningHour struct {
	Name       string  `json:"name"`
	Markdown   string  `json:"markdown"`
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
}

// Shift is one cafe_shifts row, always with its worker populated (every
// query joins it) - a shift is meaningless to render without knowing who's
// working it, same reasoning as Election.Committee.
type Shift struct {
	ID       string          `json:"id"`
	Date     time.Time       `json:"date"`
	TimeSlot TimeSlot        `json:"timeSlot"`
	Worker   apitypes.Member `json:"worker"`
}

// Ciabatta is a ciabatta_of_the_week row.
type Ciabatta struct {
	ID   string `json:"id"`
	Year int32  `json:"year"`
	Week int32  `json:"week"`
	Name string `json:"name"`
}

// Schedule is one week's worth of cafe data - the combined shape the old
// committees/cafe page's single load() returned (shifts + ciabatta,
// resolved together since both are scoped to the same target week; opening
// hours are separate, see ListOpeningHours, since they don't vary by week).
// Year/Week echo back the resolved target week (which may differ from a
// caller-omitted request), so a client can build "next/previous week" links
// without recomputing week math itself.
type Schedule struct {
	Year     int32     `json:"year"`
	Week     int32     `json:"week"`
	Shifts   []Shift   `json:"shifts"`
	Ciabatta *Ciabatta `json:"ciabatta,omitempty"`
}

// SetShiftInput is PUT /cafe/shifts' body - see Service.SetShift's doc
// comment for the full sign-up/quit/reassign logic this drives.
// StudentID, when set, requires CafeEditWorkers (mirrors the old app's
// EDIT_WORKERS-gated "worker" form field); omitted, it defaults to the
// caller's own student id (self-signup).
type SetShiftInput struct {
	Date      string   `json:"date"` // YYYY-MM-DD
	TimeSlot  TimeSlot `json:"timeSlot"`
	StudentID *string  `json:"studentId,omitempty"`
}

// ShiftMutationResult is SetShift's response - Action tells the caller
// which of the three real outcomes happened (Go doesn't own user-facing
// copy for these; the old app's m.cafe_signed_up/m.cafe_quit_shift/etc.
// message selection is a frontend concern, deferred to Phase 13 same as
// the rest of this page's UI).
type ShiftMutationResult struct {
	Action string `json:"action"` // "signed_up" | "quit" | "reassigned"
	Shift  *Shift `json:"shift,omitempty"`
}

// SetCiabattaInput is PUT /cafe/ciabatta's body - an upsert, matching the
// old editWeeklyCiabatta action exactly (create-or-update on (year, week)).
type SetCiabattaInput struct {
	Year int32  `json:"year"`
	Week int32  `json:"week"`
	Name string `json:"name"`
}
