package cafe

import (
	"time"

	"github.com/danielgtaylor/huma/v2"

	"github.com/dsek-lth/web/apps/backend/internal/apitypes"
)

type TimeSlot string

const (
	TimeSlotDayManager TimeSlot = "DAYMANAGER"
	TimeSlotShift1     TimeSlot = "SHIFT_1"
	TimeSlotShift2     TimeSlot = "SHIFT_2"
	TimeSlotShift3     TimeSlot = "SHIFT_3"
)

func (TimeSlot) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "CafeTimeSlot", "DAYMANAGER", "SHIFT_1", "SHIFT_2", "SHIFT_3")
}

// ShiftAction is what toggling a shift did.
type ShiftAction string

const (
	ShiftSignedUp   ShiftAction = "signed_up"
	ShiftQuit       ShiftAction = "quit"
	ShiftReassigned ShiftAction = "reassigned"
)

func (ShiftAction) Schema(r huma.Registry) *huma.Schema {
	return apitypes.EnumSchema(r, "CafeShiftAction", "signed_up", "quit", "reassigned")
}

// CafeOpeningHours is one "cafe:open*"-named markdowns row - see
// Service.ListOpeningHours. Ships both the raw markdownSv/markdownEn pair
// and one resolved markdown field, same pattern as Election/Alert.
type CafeOpeningHours struct {
	Name       string  `json:"name"                 doc:"The info page's name, e.g. cafe:open:0; edit it with PUT /info-pages/{slug}."`
	Markdown   string  `json:"markdown"             doc:"markdownEn or markdownSv, resolved from Accept-Language."`
	MarkdownSv string  `json:"markdownSv"`
	MarkdownEn *string `json:"markdownEn,omitempty"`
}

// CafeShift is one cafe_shifts row, always with its worker populated (every
// query joins it) - a shift is meaningless to render without knowing who's
// working it, same reasoning as Election.Committee.
type CafeShift struct {
	ID       string          `json:"id"`
	Date     time.Time       `json:"date"     doc:"The day."`
	TimeSlot TimeSlot        `json:"timeSlot" doc:"DAYMANAGER is the day's manager; SHIFT_1 to SHIFT_3 are its shifts."`
	Worker   apitypes.Member `json:"worker"   doc:"Who works the shift."`
}

// Ciabatta is a ciabatta_of_the_week row.
type Ciabatta struct {
	ID   string `json:"id"`
	Year int32  `json:"year"`
	Week int32  `json:"week" doc:"ISO week number."`
	Name string `json:"name" doc:"The ciabatta."`
}

// CafeSchedule is one week's worth of cafe data - the combined shape the old
// committees/cafe page's single load() returned (shifts + ciabatta,
// resolved together since both are scoped to the same target week; opening
// hours are separate, see ListOpeningHours, since they don't vary by week).
// Year/Week echo back the resolved target week (which may differ from a
// caller-omitted request), so a client can build "next/previous week" links
// without recomputing week math itself.
type CafeSchedule struct {
	Year     int32       `json:"year"               doc:"ISO year of the week shown."`
	Week     int32       `json:"week"               doc:"ISO week shown."`
	Shifts   []CafeShift `json:"shifts"             doc:"Every filled shift that week; a missing slot is open."`
	Ciabatta *Ciabatta   `json:"ciabatta,omitempty" doc:"That week's ciabatta, if set."`
}

// CafeShiftToggleInput is POST /cafe/shifts/toggle's body - see Service.SetShift's doc
// comment for the full sign-up/quit/reassign logic this drives.
// StudentID, when set, requires CafeEditWorkers (mirrors the old app's
// EDIT_WORKERS-gated "worker" form field); omitted, it defaults to the
// caller's own student id (self-signup).
type CafeShiftToggleInput struct {
	Date      string   `json:"date"                doc:"YYYY-MM-DD."`
	TimeSlot  TimeSlot `json:"timeSlot"`
	StudentID *string  `json:"studentId,omitempty" doc:"Who to put on the shift; the caller if omitted. Anyone else needs cafe:edit_workers."`
}

// CafeShiftResult is SetShift's response - Action tells the caller
// which of the three real outcomes happened (Go doesn't own user-facing
// copy for these; the old app's m.cafe_signed_up/m.cafe_quit_shift/etc.
// message selection is a frontend concern, deferred to Phase 14 same as
// the rest of this page's UI).
type CafeShiftResult struct {
	Action ShiftAction `json:"action"          doc:"What happened."`
	Shift  *CafeShift  `json:"shift,omitempty" doc:"The shift now. Omitted after quit."`
}

// CiabattaInput is PUT /cafe/ciabattas/{year}/{week}'s body - an upsert, matching the
// old editWeeklyCiabatta action exactly (create-or-update on (year, week)).
type CiabattaInput struct {
	Name string `json:"name" doc:"The ciabatta."`
}
