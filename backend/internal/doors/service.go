// Package doors is the physical-access-control domain - see DESIGN.md's
// roadmap "Phase 10: Doors/Salto". Ported from src/routes/(app)/admin/doors
// (management UI), src/routes/(app)/salto/[door] (the public endpoint the
// university's Salto door-lock system itself polls - see its own README.md:
// "this URL must not be changed"), and src/lib/utils/member.ts's
// getCurrentDoorPoliciesForMember (a member's own profile-page "which doors
// do I have access to" widget).
package doors

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/apitypes"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/locale"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrNotFound     = errors.New("doors: not found")
	ErrInvalidInput = errors.New("doors: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// backupStudentIDs is BACKUP_LIST_OF_STUDENT_IDS, ported verbatim from
// src/routes/(app)/salto/[door]/constants.ts - the fail-safe list every
// door falls back to when no policy resolves any allowed student (or the
// resolution itself errors), so a DB hiccup or a misconfigured door never
// locks out the people who need physical access to fix it. Needs updating
// at the turn of every year by the Head of Faculties (Källarmästare) - not
// something to "clean up" here.
var backupStudentIDs = []string{
	"em8241he-s", // Källarmästare, Emil Helander
	"da1677ag-s", // Processmästare, David Agardh
	"el0016sv-s", // Ordförande, Ella Svensson
	"lu7015ge-s", // Skattmästare, Ludwig Gehlsdorf
	"da6673he-s", // Revisor, Dag Hemberg
	"wi3671ri-s", // Revisor, William Rilde
}

type Service struct {
	queries *db.Queries
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx)}
}

func (s *Service) ListDoors(ctx context.Context) ([]Door, error) {
	if err := auth.Require(ctx, apinames.DoorRead); err != nil {
		return nil, err
	}
	rows, err := s.queries.ListDoors(ctx)
	if err != nil {
		return nil, fmt.Errorf("list doors: %w", err)
	}
	out := make([]Door, len(rows))
	for i, r := range rows {
		out[i] = Door{Name: r.Name, VerboseName: r.VerboseName}
	}
	return out, nil
}

func (s *Service) ListAccessPolicies(
	ctx context.Context,
	doorName string,
) ([]DoorAccessPolicy, error) {
	if err := auth.Require(ctx, apinames.DoorRead); err != nil {
		return nil, err
	}
	if _, err := s.queries.GetDoorByName(ctx, doorName); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get door: %w", err)
	}

	rows, err := s.queries.ListDoorAccessPoliciesForAdmin(ctx, doorName)
	if err != nil {
		return nil, fmt.Errorf("list door access policies: %w", err)
	}
	out := make([]DoorAccessPolicy, len(rows))
	for i, r := range rows {
		policy := DoorAccessPolicy{
			ID:            dbutil.UUIDStr(r.ID),
			DoorName:      r.DoorName,
			Role:          dbutil.TextPtr(r.Role),
			StudentID:     dbutil.TextPtr(r.StudentID),
			StartDatetime: dbutil.TimePtr(r.StartDatetime),
			EndDatetime:   dbutil.TimePtr(r.EndDatetime),
			IsBan:         r.IsBan,
			Information:   dbutil.TextPtr(r.Information),
		}
		if r.MemberID.Valid {
			policy.Member = &apitypes.Member{
				ID:        dbutil.UUIDStr(r.MemberID),
				StudentID: dbutil.TextPtr(r.StudentID),
				FirstName: dbutil.TextPtr(r.MemberFirstName),
				LastName:  dbutil.TextPtr(r.MemberLastName),
				Nickname:  dbutil.TextPtr(r.MemberNickname),
			}
		}
		out[i] = policy
	}
	return out, nil
}

// CreateAccessPolicy ports edit/[slug]/+page.server.ts's createSchema
// .refine() chain verbatim, including the "banning groups is not
// implemented" restriction (TODO in the original) and the member-rule
// require-end/require-reason rules.
func (s *Service) CreateAccessPolicy(
	ctx context.Context,
	doorName string,
	in CreatePolicyInput,
) (*DoorAccessPolicy, error) {
	if err := auth.Require(ctx, apinames.DoorCreate); err != nil {
		return nil, err
	}
	if _, err := s.queries.GetDoorByName(ctx, doorName); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get door: %w", err)
	}

	if strings.TrimSpace(in.Subject) == "" {
		return nil, invalidf("subject is required")
	}
	subjectType := in.Type
	if subjectType == "" {
		subjectType = "member"
	}
	if subjectType != "member" && subjectType != "role" {
		return nil, invalidf("invalid type %q", subjectType)
	}
	mode := in.Mode
	if mode == "" {
		mode = "allow"
	}
	if mode != "allow" && mode != "deny" {
		return nil, invalidf("invalid mode %q", mode)
	}
	if in.StartDatetime != nil && in.EndDatetime != nil &&
		in.EndDatetime.Before(*in.StartDatetime) {
		return nil, invalidf("endDatetime must not be before startDatetime")
	}
	if subjectType == "member" && in.EndDatetime == nil {
		return nil, invalidf("endDatetime is required for member rules")
	}
	if subjectType == "member" && (in.Reason == nil || strings.TrimSpace(*in.Reason) == "") {
		return nil, invalidf("reason is required for member rules")
	}
	if mode == "deny" && (in.Reason == nil || strings.TrimSpace(*in.Reason) == "") {
		return nil, invalidf("reason is required for bans")
	}
	if subjectType == "role" && mode == "deny" {
		return nil, invalidf("banning groups is not implemented")
	}

	if subjectType == "member" {
		if _, err := s.queries.GetMemberByStudentID(
			ctx,
			pgtype.Text{String: in.Subject, Valid: true},
		); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, invalidf("no member with studentId %q", in.Subject)
			}
			return nil, fmt.Errorf("look up member: %w", err)
		}
	} else if in.Subject != "*" {
		exists, err := s.queries.ExistsPositionWithPrefix(ctx, in.Subject+"%")
		if err != nil {
			return nil, fmt.Errorf("look up position: %w", err)
		}
		if !exists {
			return nil, invalidf("no role/position matching %q", in.Subject)
		}
	}

	params := db.CreateDoorAccessPolicyParams{
		DoorName:      doorName,
		StartDatetime: dbutil.ToTimestamptz(in.StartDatetime),
		EndDatetime:   dbutil.ToTimestamptz(in.EndDatetime),
		IsBan:         mode == "deny",
		Information:   dbutil.ToText(in.Reason),
	}
	if subjectType == "member" {
		params.StudentID = pgtype.Text{String: in.Subject, Valid: true}
	} else {
		params.Role = pgtype.Text{String: in.Subject, Valid: true}
	}

	row, err := s.queries.CreateDoorAccessPolicy(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("create door access policy: %w", err)
	}
	return &DoorAccessPolicy{
		ID:            dbutil.UUIDStr(row.ID),
		DoorName:      row.DoorName,
		Role:          dbutil.TextPtr(row.Role),
		StudentID:     dbutil.TextPtr(row.StudentID),
		StartDatetime: dbutil.TimePtr(row.StartDatetime),
		EndDatetime:   dbutil.TimePtr(row.EndDatetime),
		IsBan:         row.IsBan,
		Information:   dbutil.TextPtr(row.Information),
	}, nil
}

func (s *Service) DeleteAccessPolicy(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.DoorDelete); err != nil {
		return err
	}
	policyID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid id: %v", err)
	}
	if err := s.queries.DeleteDoorAccessPolicy(ctx, policyID); err != nil {
		return fmt.Errorf("delete door access policy: %w", err)
	}
	return nil
}

// ResolveAllowedStudentIDs is the actual security-relevant logic behind
// GET /salto/{door} - a public, unauthenticated read (the university's
// Salto system polls it directly, with no session of its own - see the
// package doc comment), so this deliberately never calls auth.Require.
//
// Ported from +server.ts's GET handler: split active (non-expired,
// already-started) policies into per-student and per-role/position grants,
// resolve the "*" wildcard (members active within the last ~10 class
// years), resolve role-based grants to their current mandate holders (see
// ListPositionIDsMatchingPrefixes's doc comment for the real-prefix-match
// fix, user-confirmed 2026-09-03), subtract banned students, and fall back
// to backupStudentIDs if the result is empty - matching the old app's
// "never return zero people who can get into the building" behavior. Like
// the old app, any error along the way also falls back to the backup list
// rather than propagating - a deliberate fail-open choice already made by
// the code being ported, not introduced here.
func (s *Service) ResolveAllowedStudentIDs(ctx context.Context, doorName string) []string {
	allowed, err := s.resolveAllowedStudentIDs(ctx, doorName)
	if err != nil || len(allowed) == 0 {
		return backupStudentIDs
	}
	return allowed
}

func (s *Service) resolveAllowedStudentIDs(ctx context.Context, doorName string) ([]string, error) {
	policies, err := s.queries.ListActiveDoorAccessPoliciesForSalto(ctx, doorName)
	if err != nil {
		return nil, fmt.Errorf("list active door access policies: %w", err)
	}

	// Mirrors parseDoorPolicies/parseDoorBanPolicies exactly: studentId and
	// role are read independently per row, not as a mutually-exclusive
	// switch - a row's studentId (if set) always feeds studentIDs and a
	// row's role (if set) always feeds roles, regardless of the other field
	// or of isBan. Only a banned row's own studentId is collected into
	// bannedStudentIDs - a banned row's role is still used for position
	// matching below (the old app's parseDoorBanPolicies comment: "for now
	// we are only interested in the studentIds that are banned"), and a row
	// with both fields set contributes to both lists. This is a faithful,
	// mechanical port, not a redesign - real door_access_policies rows only
	// ever have one of the two fields set (enforced by the admin create
	// form), so this only matters for malformed/legacy data.
	var studentIDs, roles, bannedStudentIDs []string
	for _, p := range policies {
		if p.StudentID.Valid {
			studentIDs = append(studentIDs, p.StudentID.String)
			if p.IsBan {
				bannedStudentIDs = append(bannedStudentIDs, p.StudentID.String)
			}
		}
		if p.Role.Valid {
			roles = append(roles, p.Role.String)
		}
	}

	var studentsFromWildcard []string
	var rolePatterns []string
	for _, role := range roles {
		if role == "*" {
			rows, err := s.queries.ListRecentMemberStudentIDs(ctx, int32(time.Now().Year()-10))
			if err != nil {
				return nil, fmt.Errorf("list recent members: %w", err)
			}
			for _, sid := range rows {
				if sid.Valid {
					studentsFromWildcard = append(studentsFromWildcard, sid.String)
				}
			}
			continue
		}
		rolePatterns = append(rolePatterns, role+"%")
	}

	var studentsFromPositions []string
	if len(rolePatterns) > 0 {
		positionIDs, err := s.queries.ListPositionIDsMatchingPrefixes(ctx, rolePatterns)
		if err != nil {
			return nil, fmt.Errorf("list matching positions: %w", err)
		}
		if len(positionIDs) > 0 {
			rows, err := s.queries.ListStudentIDsForActivePositions(ctx, positionIDs)
			if err != nil {
				return nil, fmt.Errorf("list students for positions: %w", err)
			}
			for _, sid := range rows {
				if sid.Valid {
					studentsFromPositions = append(studentsFromPositions, sid.String)
				}
			}
		}
	}

	banned := make(map[string]bool, len(bannedStudentIDs))
	for _, sid := range bannedStudentIDs {
		banned[sid] = true
	}

	seen := make(map[string]bool)
	var allowed []string
	for _, sid := range append(append(studentIDs, studentsFromPositions...), studentsFromWildcard...) {
		if banned[sid] || seen[sid] {
			continue
		}
		seen[sid] = true
		allowed = append(allowed, sid)
	}
	return allowed, nil
}

// MemberAccess ports src/lib/utils/member.ts's
// getCurrentDoorPoliciesForMember - the member profile page's self-view
// "which doors do you have access to" widget. Self-scoped only, exactly
// like the old app (members/[studentId]/+page.server.ts only ever called
// it when member.id === user?.memberId): an anonymous caller or a caller
// asking about someone else's studentId silently gets an empty list back,
// never an error - matches the old ternary's `: []` branch exactly, not a
// 403 (this is a display widget, not the access-granting mechanism itself).
func (s *Service) MemberAccess(ctx context.Context, studentID string) ([]MemberAccess, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok || identity.StudentID == "" || identity.StudentID != studentID {
		return []MemberAccess{}, nil
	}

	positions, err := s.queries.ListActivePositionsForMemberByStudentID(
		ctx,
		pgtype.Text{String: studentID, Valid: true},
	)
	if err != nil {
		return nil, fmt.Errorf("list active positions: %w", err)
	}

	roleSet := map[string]bool{"*": true, "_": true}
	boardMember := false
	for _, pos := range positions {
		parts := strings.Split(pos.ID, ".")
		for i := range parts {
			roleSet[strings.Join(parts[:i+1], ".")] = true
		}
		if pos.BoardMember {
			boardMember = true
		}
	}
	if boardMember {
		roleSet["dsek.styr"] = true
	}
	roles := make([]string, 0, len(roleSet))
	for r := range roleSet {
		roles = append(roles, r)
	}

	rows, err := s.queries.ListDoorAccessPoliciesForMemberView(
		ctx,
		db.ListDoorAccessPoliciesForMemberViewParams{
			StudentID: pgtype.Text{String: studentID, Valid: true},
			Roles:     roles,
		},
	)
	if err != nil {
		return nil, fmt.Errorf("list door access policies for member: %w", err)
	}

	type groupKey struct {
		doorName string
		start    time.Time
		hasStart bool
		end      time.Time
		hasEnd   bool
	}
	type group struct {
		verboseName string
		roles       []string
		start       *time.Time
		end         *time.Time
	}
	order := []groupKey{}
	groups := map[groupKey]*group{}
	for _, r := range rows {
		key := groupKey{doorName: r.DoorName}
		if r.StartDatetime.Valid {
			key.start, key.hasStart = r.StartDatetime.Time, true
		}
		if r.EndDatetime.Valid {
			key.end, key.hasEnd = r.EndDatetime.Time, true
		}
		role := "Du"
		if r.Role.Valid {
			role = r.Role.String
		}
		g, ok := groups[key]
		if !ok {
			g = &group{
				verboseName: r.VerboseName,
				start:       dbutil.TimePtr(r.StartDatetime),
				end:         dbutil.TimePtr(r.EndDatetime),
			}
			groups[key] = g
			order = append(order, key)
		}
		g.roles = append(g.roles, role)
	}

	loc := locale.FromContext(ctx)
	out := make([]MemberAccess, 0, len(order))
	for _, key := range order {
		g := groups[key]
		var matchedPositionNames []string
		for _, pos := range positions {
			matches := false
			for _, role := range g.roles {
				if strings.HasPrefix(pos.ID, role) || (pos.BoardMember && role == "dsek.styr") {
					matches = true
					break
				}
			}
			if matches {
				matchedPositionNames = append(
					matchedPositionNames,
					dbutil.ResolveName(pos.NameSv, dbutil.TextPtr(pos.NameEn), loc),
				)
			}
		}
		sort.Strings(matchedPositionNames)
		roles := matchedPositionNames
		if len(roles) == 0 {
			roles = []string{"Du"}
		}
		out = append(out, MemberAccess{
			Name:          key.doorName,
			VerboseName:   g.verboseName,
			Roles:         roles,
			StartDatetime: g.start,
			EndDatetime:   g.end,
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out, nil
}
