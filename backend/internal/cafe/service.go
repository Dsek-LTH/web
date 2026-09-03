// Package cafe is the committees/cafe domain behind /cafe/* - shift
// scheduling, ciabatta-of-the-week, and opening-hours listing for the cafe
// committee - see DESIGN.md's roadmap Phase 8 ("Cafe"). Ported from
// src/routes/(app)/committees/cafe/+page.server.ts. The committee page
// itself (about text, positions, banner) is already served by
// internal/committees (Phase 1) - this package only covers the
// cafe-specific tabs that page adds on top. Deliberately scoped to just
// shifts/ciabatta/opening-hours: the roadmap's own "shifts + drink
// inventory" phase description turned out to conflate this feature with
// admin/stocklist (DrinkItem/DrinkItemBatch/SexetInventoryValueLog),
// already separately listed under Phase 11 ("Admin consolidation") - see
// DESIGN.md's Phase 8 entry for the user-confirmed correction.
package cafe

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/locale"
)

var (
	ErrNotFound     = errors.New("cafe: not found")
	ErrInvalidInput = errors.New("cafe: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

type Service struct {
	queries *db.Queries
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx)}
}

// ListOpeningHours is a public read - every "cafe:open*"-named markdowns
// row, ordered by name, matching the old load()'s
// prisma.markdown.findMany({where: {name: {startsWith: "cafe:open"}},
// orderBy: {name: "asc"}}) exactly. Writing an opening-hours page reuses
// the already-shipped generic markdown.Service (PATCH /info/{slug}) rather
// than a bespoke endpoint here - the old app's own updateHours action
// already just delegated to the same generic updateMarkdown helper,
// one page per submit, so pointing a future frontend at /info/{slug}
// directly isn't a functionality reduction, just skipping a redundant
// wrapper.
func (s *Service) ListOpeningHours(ctx context.Context) ([]OpeningHour, error) {
	rows, err := s.queries.ListMarkdownsByPrefix(ctx, "cafe:open%")
	if err != nil {
		return nil, fmt.Errorf("list opening hours: %w", err)
	}
	loc := locale.FromContext(ctx)
	out := make([]OpeningHour, len(rows))
	for i, row := range rows {
		out[i] = toOpeningHour(row, loc)
	}
	return out, nil
}

// GetSchedule is a public-ish read: shifts and the ciabatta-of-the-week for
// one calendar week, resolving to the current ISO week when year/week are
// omitted. A caller without CafeSeeAllWeeks can only view the current week
// through two weeks out (matching the old app's `weekNum < currentWeek ||
// weekNum > currentWeek + 2` bound exactly) - checked here as a data-
// dependent 403, not auth.Require, since it isn't a fixed policy gate.
//
// Deliberate deviation from the old app: it computed a target week as
// `dayjs().startOf("year").add(weekNum-1, "week")` and rendered week
// numbers via dayjs's weekOfYear plugin, which (in its default, no-locale-
// override configuration) uses a non-ISO "week 1 contains Jan 1, weeks
// start on Sunday" convention with its own idiosyncratic year-boundary
// rules. This package uses real ISO-8601 week semantics (Go's
// time.Time.ISOWeek(), Monday-start, week 1 contains the year's first
// Thursday) instead of porting that algorithm - a deliberate simplification
// given nothing renders this page yet (still <NotImplemented />, per
// backend/CLAUDE.md's Cafe routes section) and ISO weeks are the
// unsurprising standard choice for whichever frontend eventually consumes
// this. Revisit only if a real consumer needs bit-for-bit dayjs parity for
// specific historical week numbers.
func (s *Service) GetSchedule(ctx context.Context, year, week *int32) (*Schedule, error) {
	targetYear, targetWeek, err := resolveTargetWeek(ctx, year, week)
	if err != nil {
		return nil, err
	}

	weekStart := mondayOfISOWeek(int(targetYear), int(targetWeek))
	weekEnd := weekStart.AddDate(0, 0, 6)

	rows, err := s.queries.ListCafeShiftsInRange(ctx, db.ListCafeShiftsInRangeParams{
		StartDate: pgtype.Timestamp{Time: weekStart, Valid: true},
		EndDate:   pgtype.Timestamp{Time: weekEnd, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("list shifts: %w", err)
	}
	shifts := make([]Shift, len(rows))
	for i, row := range rows {
		shifts[i] = toShift(shiftRow(row))
	}

	var ciabatta *Ciabatta
	ciabattaRow, err := s.queries.GetCiabattaByYearWeek(ctx, db.GetCiabattaByYearWeekParams{
		Year: targetYear,
		Week: targetWeek,
	})
	if err == nil {
		c := toCiabatta(ciabattaRow)
		ciabatta = &c
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("get ciabatta: %w", err)
	}

	return &Schedule{Year: targetYear, Week: targetWeek, Shifts: shifts, Ciabatta: ciabatta}, nil
}

// resolveTargetWeek defaults year/week to the current ISO week and enforces
// the CafeSeeAllWeeks window described on GetSchedule.
func resolveTargetWeek(ctx context.Context, year, week *int32) (int32, int32, error) {
	curYear, curWeek := time.Now().UTC().ISOWeek()

	targetYear := int32(curYear)
	if year != nil {
		targetYear = *year
	}
	targetWeek := int32(curWeek)
	if week != nil {
		targetWeek = *week
	}
	if targetWeek < 1 || targetWeek > 53 {
		return 0, 0, invalidf("week must be between 1 and 53")
	}

	hasSeeAll := false
	if identity, ok := auth.FromContext(ctx); ok {
		hasSeeAll = identity.Has(apinames.CafeSeeAllWeeks)
	}
	if !hasSeeAll {
		curMonday := mondayOfISOWeek(curYear, curWeek)
		targetMonday := mondayOfISOWeek(int(targetYear), int(targetWeek))
		diffWeeks := int(targetMonday.Sub(curMonday).Hours() / (24 * 7))
		if diffWeeks < 0 || diffWeeks > 2 {
			return 0, 0, auth.ErrForbidden
		}
	}
	return targetYear, targetWeek, nil
}

// mondayOfISOWeek returns the Monday (00:00 UTC) of the given ISO-8601
// week - see GetSchedule's doc comment for why this package uses real ISO
// week semantics rather than porting dayjs's weekOfYear plugin.
func mondayOfISOWeek(year, week int) time.Time {
	// Jan 4th always falls in ISO week 1.
	jan4 := time.Date(year, time.January, 4, 0, 0, 0, 0, time.UTC)
	daysSinceMonday := (int(jan4.Weekday()) + 6) % 7
	week1Monday := jan4.AddDate(0, 0, -daysSinceMonday)
	return week1Monday.AddDate(0, 0, (week-1)*7)
}

func todayUTC() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}

func validTimeSlot(t TimeSlot) bool {
	switch t {
	case TimeSlotDayManager, TimeSlotShift1, TimeSlotShift2, TimeSlotShift3:
		return true
	}
	return false
}

// SetShift signs the caller (or, with CafeEditWorkers, a specified member)
// up for a shift, quits an existing one, or reassigns one - a single
// endpoint mirroring the old updateSchedule action's toggle design (a
// caller always knows from the schedule it just rendered whether a slot is
// taken and by whom, so it always has enough information to know which of
// the three outcomes it's asking for).
//
// Requires an identity - a real, necessary explicit check to add: the old
// action had none, relying on `worker` ending up empty/undefined for an
// anonymous caller and the resulting prisma create failing incidentally.
func (s *Service) SetShift(ctx context.Context, in SetShiftInput) (*ShiftMutationResult, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok {
		return nil, auth.ErrUnauthenticated
	}
	isAdmin := identity.Has(apinames.CafeEditWorkers)

	targetStudentID := identity.StudentID
	if in.StudentID != nil && *in.StudentID != "" {
		targetStudentID = *in.StudentID
	}
	if targetStudentID != identity.StudentID && !isAdmin {
		return nil, auth.ErrForbidden
	}
	if !validTimeSlot(in.TimeSlot) {
		return nil, invalidf("invalid timeSlot %q", in.TimeSlot)
	}

	date, err := time.ParseInLocation("2006-01-02", in.Date, time.UTC)
	if err != nil {
		return nil, invalidf("invalid date %q, expected YYYY-MM-DD", in.Date)
	}

	targetMember, err := s.queries.GetMemberByStudentID(ctx, dbutil.ToText(&targetStudentID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, invalidf("member %q does not exist", targetStudentID)
		}
		return nil, fmt.Errorf("look up member: %w", err)
	}

	dayShifts, err := s.queries.ListCafeShiftsInRange(ctx, db.ListCafeShiftsInRangeParams{
		StartDate: pgtype.Timestamp{Time: date, Valid: true},
		EndDate:   pgtype.Timestamp{Time: date, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("list day shifts: %w", err)
	}

	var existing *db.ListCafeShiftsInRangeRow
	for i := range dayShifts {
		if dayShifts[i].TimeSlot == db.TimeSlots(in.TimeSlot) {
			existing = &dayShifts[i]
			break
		}
	}

	if existing == nil {
		return s.createShift(ctx, identity, isAdmin, date, in.TimeSlot, targetMember, dayShifts)
	}
	return s.resolveExistingShift(ctx, isAdmin, targetStudentID, targetMember, date, *existing)
}

func (s *Service) createShift(
	ctx context.Context,
	identity *auth.Identity,
	isAdmin bool,
	date time.Time,
	slot TimeSlot,
	targetMember db.GetMemberByStudentIDRow,
	dayShifts []db.ListCafeShiftsInRangeRow,
) (*ShiftMutationResult, error) {
	if slot == TimeSlotDayManager && !identity.Has(apinames.CafeDayManager) && !isAdmin {
		return nil, auth.ErrForbidden
	}
	if !isAdmin && date.Before(todayUTC()) {
		return nil, invalidf("cannot sign up for a shift in the past")
	}
	if !isAdmin {
		// Matches the old app's real behavior: this checks the *acting*
		// identity's own other shifts that day, not the target's - which
		// only matters here since isAdmin already guards every path where
		// target != identity.
		for _, d := range dayShifts {
			if d.TimeSlot != db.TimeSlots(slot) &&
				d.WorkerStudentID.Valid && d.WorkerStudentID.String == identity.StudentID {
				return nil, invalidf("you already have a shift this day")
			}
		}
	}

	row, err := s.queries.CreateCafeShift(ctx, db.CreateCafeShiftParams{
		Date:     pgtype.Timestamp{Time: date, Valid: true},
		WorkerID: targetMember.ID,
		TimeSlot: db.TimeSlots(slot),
	})
	if err != nil {
		return nil, fmt.Errorf("create shift: %w", err)
	}
	shift, err := s.reloadShift(ctx, row.ID)
	if err != nil {
		return nil, err
	}
	return &ShiftMutationResult{Action: "signed_up", Shift: shift}, nil
}

func (s *Service) resolveExistingShift(
	ctx context.Context,
	isAdmin bool,
	targetStudentID string,
	targetMember db.GetMemberByStudentIDRow,
	date time.Time,
	existing db.ListCafeShiftsInRangeRow,
) (*ShiftMutationResult, error) {
	if existing.WorkerStudentID.Valid && existing.WorkerStudentID.String == targetStudentID {
		// Quitting one's own shift (or, for an admin, anyone's). Day-
		// granular cutoff (must be more than a day out), a deliberate
		// simplification of the old app's exact `shiftDate >
		// dayjs().add(1, "day")` instant comparison and its two distinct
		// "too close"/"already passed" error messages - not preserved
		// since nothing renders this page yet to display them.
		if !isAdmin && !date.After(todayUTC().AddDate(0, 0, 1)) {
			return nil, invalidf("too close to the shift date to cancel")
		}
		n, err := s.queries.DeleteCafeShift(ctx, existing.ID)
		if err != nil {
			return nil, fmt.Errorf("delete shift: %w", err)
		}
		if n == 0 {
			return nil, ErrNotFound
		}
		return &ShiftMutationResult{Action: "quit"}, nil
	}

	// Someone else already has this shift - only an admin may reassign it.
	if !isAdmin {
		return nil, auth.ErrForbidden
	}
	row, err := s.queries.UpdateCafeShiftWorker(ctx, db.UpdateCafeShiftWorkerParams{
		ID:       existing.ID,
		WorkerID: targetMember.ID,
	})
	if err != nil {
		return nil, fmt.Errorf("reassign shift: %w", err)
	}
	shift, err := s.reloadShift(ctx, row.ID)
	if err != nil {
		return nil, err
	}
	return &ShiftMutationResult{Action: "reassigned", Shift: shift}, nil
}

func (s *Service) reloadShift(ctx context.Context, id pgtype.UUID) (*Shift, error) {
	row, err := s.queries.GetCafeShiftByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("reload shift: %w", err)
	}
	shift := toShift(shiftRow(row))
	return &shift, nil
}

// SetCiabatta upserts the ciabatta-of-the-week for a given (year, week),
// matching the old editWeeklyCiabatta action's prisma upsert exactly.
func (s *Service) SetCiabatta(ctx context.Context, in SetCiabattaInput) (*Ciabatta, error) {
	if err := auth.Require(ctx, apinames.CafeEditCiabattas); err != nil {
		return nil, err
	}
	if in.Name == "" {
		return nil, invalidf("name is required")
	}
	if in.Week < 1 || in.Week > 53 {
		return nil, invalidf("week must be between 1 and 53")
	}
	row, err := s.queries.UpsertCiabatta(ctx, db.UpsertCiabattaParams{
		Year: in.Year,
		Week: in.Week,
		Name: in.Name,
	})
	if err != nil {
		return nil, fmt.Errorf("upsert ciabatta: %w", err)
	}
	c := toCiabatta(row)
	return &c, nil
}
