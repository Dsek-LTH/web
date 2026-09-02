// Package medals is the read-only computed-medals domain behind
// /medals - see DESIGN.md's Phase 3 ("Simple standalone CRUD") section.
// Ported from src/lib/server/medals/medals.ts and
// src/routes/(app)/medals/*. No writes, no dedicated table - everything is
// derived from mandates/positions/committees, already in schema.sql.
package medals

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apitypes"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/locale"
	"github.com/dsek-lth/web/backend/internal/semesters"
)

// medalNames mirrors messages_{sv,en}.json's medals_volunteerMedal/
// medals_gammalOchÄcklig/medals_committeeMedal - hardcoded here since Go
// has no paraglide message catalog; resolved via internal/locale like
// every other translated string in this API.
var medalNames = map[string]struct{ sv, en string }{
	"volunteer":       {"Funktionärsmedalj", "Volunteer medal"},
	"gammalOchAcklig": {"Gammal && Äcklig", "Gammal && Äcklig"},
	"committee":       {"Utskottsmedalj", "Committee medal"},
}

func medalName(key, loc string) string {
	n := medalNames[key]
	if loc == "en" {
		return n.en
	}
	return n.sv
}

func committeeMedalName(nameSv string, nameEn *string, loc string) string {
	return medalName("committee", loc) + " — " + dbutil.ResolveName(nameSv, nameEn, loc)
}

type Service struct {
	queries *db.Queries
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx)}
}

// requireMember mirrors internal/members' own helper: the old app's medals
// routes had no medals-specific authorize() call (apiNames.MEDALS.MANAGE
// exists but is never referenced by them), relying only on generic
// Mandate read access - replicated as-is (any logged-in member), not
// silently tightened into a new enforcement point the old app never had.
func requireMember(ctx context.Context) (*auth.Identity, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok || identity.MemberID == "" {
		return nil, auth.ErrUnauthenticated
	}
	return identity, nil
}

// MemberMedals mirrors memberMedals: which medals a specific member earned
// (and after which semester), evaluated as of `after`.
func (s *Service) MemberMedals(
	ctx context.Context,
	memberID string,
	after semesters.Semester,
) ([]MemberMedal, error) {
	if _, err := requireMember(ctx); err != nil {
		return nil, err
	}
	id, err := dbutil.ParseUUID(memberID)
	if err != nil {
		return nil, fmt.Errorf("invalid member id: %w", err)
	}

	rows, err := s.queries.ListMemberMandatesWithPosition(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("list member mandates: %w", err)
	}
	mandates := toMandateInfos(rows)

	committees, err := s.queries.ListCommitteesWithMedals(ctx)
	if err != nil {
		return nil, fmt.Errorf("list committees with medals: %w", err)
	}

	volunteerSems := filterAtMost(coveredSemesters(mandates), after)
	var boardMandates []mandateInfo
	for _, m := range mandates {
		if m.BoardMember {
			boardMandates = append(boardMandates, m)
		}
	}
	boardSems := filterAtMost(coveredSemesters(boardMandates), after)

	loc := locale.FromContext(ctx)
	var out []MemberMedal

	if sem, ok := volunteerMedalSemester(volunteerSems); ok {
		out = append(
			out,
			MemberMedal{Medal: medalName("volunteer", loc), After: semesters.String(sem)},
		)
	}
	if sem, ok := gammalOchAcklig(boardSems, volunteerSems); ok {
		out = append(
			out,
			MemberMedal{Medal: medalName("gammalOchAcklig", loc), After: semesters.String(sem)},
		)
	}
	for _, c := range committees {
		var committeeMandates []mandateInfo
		for _, m := range mandates {
			if m.CommitteeID != nil && *m.CommitteeID == dbutil.UUIDStr(c.ID) {
				committeeMandates = append(committeeMandates, m)
			}
		}
		sems := filterAtMost(coveredSemesters(committeeMandates), after)
		if sem, ok := committeeMedalSemester(sems); ok {
			out = append(out, MemberMedal{
				Medal: committeeMedalName(c.NameSv, dbutil.TextPtr(c.NameEn), loc),
				After: semesters.String(sem),
			})
		}
	}

	return out, nil
}

// MedalRecipients mirrors medalRecipients: for a given semester, every
// member who earned each medal after exactly that semester.
func (s *Service) MedalRecipients(
	ctx context.Context,
	after semesters.Semester,
) ([]MedalRecipients, error) {
	if _, err := requireMember(ctx); err != nil {
		return nil, err
	}

	candidateIDs, err := s.queries.ListMemberIDsWithMandateActiveDuring(
		ctx,
		db.ListMemberIDsWithMandateActiveDuringParams{
			WindowStart: toPgDate(semesters.StartDate(after)),
			WindowEnd:   toPgDate(semesters.EndDate(after)),
		},
	)
	if err != nil {
		return nil, fmt.Errorf("list candidate members: %w", err)
	}
	if len(candidateIDs) == 0 {
		return nil, nil
	}

	allMandateRows, err := s.queries.ListMandatesForMembersBefore(
		ctx,
		db.ListMandatesForMembersBeforeParams{
			MemberIds: candidateIDs,
			Cutoff:    toPgDate(semesters.EndDate(after)),
		},
	)
	if err != nil {
		return nil, fmt.Errorf("list candidate mandates: %w", err)
	}

	byMember := map[string][]mandateInfo{}
	for _, r := range allMandateRows {
		id := dbutil.UUIDStr(r.MemberID)
		info := mandateInfo{
			Start:       r.StartDate.Time,
			End:         r.EndDate.Time,
			BoardMember: r.BoardMember,
		}
		if r.CommitteeID.Valid {
			cid := dbutil.UUIDStr(r.CommitteeID)
			info.CommitteeID = &cid
		}
		byMember[id] = append(byMember[id], info)
	}

	loc := locale.FromContext(ctx)
	var out []MedalRecipients

	var volunteerRecipients []string
	var gammalRecipients []string
	for _, cid := range candidateIDs {
		id := dbutil.UUIDStr(cid)
		mandates := byMember[id]
		volunteerSems := filterAtMost(coveredSemesters(mandates), after)
		var boardMandates []mandateInfo
		for _, m := range mandates {
			if m.BoardMember {
				boardMandates = append(boardMandates, m)
			}
		}
		boardSems := filterAtMost(coveredSemesters(boardMandates), after)

		if sem, ok := volunteerMedalSemester(volunteerSems); ok && sem == after {
			volunteerRecipients = append(volunteerRecipients, id)
		}
		if sem, ok := gammalOchAcklig(boardSems, volunteerSems); ok && sem == after {
			gammalRecipients = append(gammalRecipients, id)
		}
	}

	if len(volunteerRecipients) > 0 {
		members, err := s.membersByIDs(ctx, volunteerRecipients)
		if err != nil {
			return nil, err
		}
		out = append(out, MedalRecipients{Medal: medalName("volunteer", loc), Recipients: members})
	}
	if len(gammalRecipients) > 0 {
		members, err := s.membersByIDs(ctx, gammalRecipients)
		if err != nil {
			return nil, err
		}
		out = append(
			out,
			MedalRecipients{Medal: medalName("gammalOchAcklig", loc), Recipients: members},
		)
	}

	committees, err := s.queries.ListCommitteesWithMedals(ctx)
	if err != nil {
		return nil, fmt.Errorf("list committees with medals: %w", err)
	}
	for _, c := range committees {
		committeeIDStr := dbutil.UUIDStr(c.ID)
		var recipients []string
		for _, cid := range candidateIDs {
			id := dbutil.UUIDStr(cid)
			var committeeMandates []mandateInfo
			for _, m := range byMember[id] {
				if m.CommitteeID != nil && *m.CommitteeID == committeeIDStr {
					committeeMandates = append(committeeMandates, m)
				}
			}
			sems := filterAtMost(coveredSemesters(committeeMandates), after)
			if sem, ok := committeeMedalSemester(sems); ok && sem == after {
				recipients = append(recipients, id)
			}
		}
		if len(recipients) == 0 {
			continue
		}
		members, err := s.membersByIDs(ctx, recipients)
		if err != nil {
			return nil, err
		}
		out = append(out, MedalRecipients{
			Medal:      committeeMedalName(c.NameSv, dbutil.TextPtr(c.NameEn), loc),
			Recipients: members,
		})
	}

	return out, nil
}

func (s *Service) membersByIDs(ctx context.Context, ids []string) ([]apitypes.Member, error) {
	uuids, err := dbutil.ParseUUIDs(ids)
	if err != nil {
		return nil, fmt.Errorf("parse member ids: %w", err)
	}
	rows, err := s.queries.ListMembersByIDs(ctx, uuids)
	if err != nil {
		return nil, fmt.Errorf("list members: %w", err)
	}
	out := make([]apitypes.Member, len(rows))
	for i, r := range rows {
		out[i] = apitypes.Member{
			ID:        dbutil.UUIDStr(r.ID),
			StudentID: dbutil.TextPtr(r.StudentID),
			FirstName: dbutil.TextPtr(r.FirstName),
			LastName:  dbutil.TextPtr(r.LastName),
		}
	}
	return out, nil
}

func toMandateInfos(rows []db.ListMemberMandatesWithPositionRow) []mandateInfo {
	out := make([]mandateInfo, len(rows))
	for i, r := range rows {
		info := mandateInfo{
			Start:       r.StartDate.Time,
			End:         r.EndDate.Time,
			BoardMember: r.BoardMember,
		}
		if r.CommitteeID.Valid {
			cid := dbutil.UUIDStr(r.CommitteeID)
			info.CommitteeID = &cid
		}
		out[i] = info
	}
	return out
}

func toPgDate(t time.Time) pgtype.Date {
	return pgtype.Date{Time: t, Valid: true}
}
