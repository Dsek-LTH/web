package nollning

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/apitypes"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/db"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
	"github.com/dsek-lth/web/apps/api/internal/sanitize"
)

type Service struct {
	queries   *db.Queries
	sanitizer *sanitize.Policy
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx), sanitizer: sanitize.UGC()}
}

// sanitizeDescription cleans a phadder group's description, which is
// HTML-capable user input - the SvelteKit action used to DOMPurify it
// before writing; Go owns that now.
func (s *Service) sanitizeDescription(d *string) *string {
	if d == nil {
		return nil
	}
	clean := s.sanitizer.Sanitize(*d)
	return &clean
}

// Current returns the season whose window covers right now, or nil (not an
// error) if none does. Within a request (see WithRequestCache) it's looked
// up once: authentication alone asks twice, and the board, gallery and
// feeds ask again.
func (s *Service) Current(ctx context.Context) (*NollningSeason, error) {
	cache, ok := ctx.Value(seasonCacheKey{}).(*seasonCache)
	if !ok {
		return s.lookupCurrent(ctx)
	}
	cache.mu.Lock()
	defer cache.mu.Unlock()
	if !cache.done {
		season, err := s.lookupCurrent(ctx)
		if err != nil {
			return nil, err
		}
		cache.season, cache.done = season, true
	}
	return cache.season, nil
}

type (
	seasonCacheKey struct{}
	seasonCache    struct {
		mu     sync.Mutex
		done   bool
		season *NollningSeason
	}
)

// WithRequestCache returns ctx with room to remember the current season
// for the rest of the request. Writing a season forgets it.
func WithRequestCache(ctx context.Context) context.Context {
	return context.WithValue(ctx, seasonCacheKey{}, &seasonCache{})
}

func forgetCurrent(ctx context.Context) {
	if cache, ok := ctx.Value(seasonCacheKey{}).(*seasonCache); ok {
		cache.mu.Lock()
		cache.done, cache.season = false, nil
		cache.mu.Unlock()
	}
}

func (s *Service) lookupCurrent(ctx context.Context) (*NollningSeason, error) {
	row, err := s.queries.GetCurrentSeason(ctx)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get current season: %w", err)
	}
	season := toSeason(row)
	return &season, nil
}

// Phase reports where "now" falls relative to the current season.
func (s *Service) Phase(ctx context.Context) (Phase, error) {
	season, err := s.Current(ctx)
	if err != nil {
		return "", err
	}
	return phaseFor(season), nil
}

func phaseFor(season *NollningSeason) Phase {
	if season == nil {
		return PhaseOff
	}
	if time.Now().Before(season.RevealAt) {
		return PhasePreReveal
	}
	return PhasePostReveal
}

// LatestRevealed is the newest season whose theme has been revealed,
// current or past, or nil if none has been.
func (s *Service) LatestRevealed(ctx context.Context) (*NollningSeason, error) {
	row, err := s.queries.GetLatestRevealedSeason(ctx)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get latest revealed season: %w", err)
	}
	season := toSeason(row)
	return &season, nil
}

// GetCurrent backs GET /nollning/current - phase, active season (if any)
// and the latest revealed season in one call.
func (s *Service) GetCurrent(ctx context.Context) (*NollningStatus, error) {
	season, err := s.Current(ctx)
	if err != nil {
		return nil, err
	}
	latest, err := s.LatestRevealed(ctx)
	if err != nil {
		return nil, err
	}
	return &NollningStatus{Phase: phaseFor(season), Season: season, LatestRevealed: latest}, nil
}

// NollaYear is the year auth.DerivedRoles' "nolla" pseudo-role should
// compare a member's classYear against: the current season's year if one
// is active, else the calendar year (a season boundary crossing a calendar year, e.g. starting in August,
// should resolve consistently with every other nollning date check rather
// than each caller computing time.Now().Year() independently).
func (s *Service) NollaYear(ctx context.Context) (int, error) {
	season, err := s.Current(ctx)
	if err != nil {
		return 0, err
	}
	if season == nil {
		return time.Now().Year(), nil
	}
	return season.Year, nil
}

// InjectStabenPolicy implements auth.StabenInjector: outside any active
// season, everyone gets apinames.MemberSeeStaben by default (there's
// nothing to hide); during one, only identities that already earned it via
// a real access-policy row keep it. Mirrors the old
// hooks.server.helpers.ts fetchAccessPolicies behavior exactly, just named
// and independently callable instead of a side effect buried inside a
// generic policy fetch.
func (s *Service) InjectStabenPolicy(ctx context.Context, policies []string) ([]string, error) {
	season, err := s.Current(ctx)
	if err != nil {
		return nil, err
	}
	if season != nil {
		return policies, nil
	}
	for _, p := range policies {
		if p == apinames.MemberSeeStaben {
			return policies, nil
		}
	}
	return append(policies, apinames.MemberSeeStaben), nil
}

// IsStaben reports whether memberID holds a mandate active today on a
// position belonging to the current season's organizing committee. No
// active season, or no organizing committee configured for it, means
// vacuously false - consistent with InjectStabenPolicy already granting
// everyone MemberSeeStaben outside a season, so nothing needs hiding then.
func (s *Service) IsStaben(ctx context.Context, memberID string) (bool, error) {
	season, err := s.Current(ctx)
	if err != nil {
		return false, err
	}
	if season == nil || season.OrganizingCommitteeID == nil {
		return false, nil
	}
	mID, err := dbutil.ParseUUID(memberID)
	if err != nil {
		return false, invalidf("invalid member id: %v", err)
	}
	cID, err := dbutil.ParseUUID(*season.OrganizingCommitteeID)
	if err != nil {
		return false, fmt.Errorf("parse organizing committee id: %w", err)
	}
	active, err := s.queries.IsMemberActiveOnCommittee(ctx, db.IsMemberActiveOnCommitteeParams{
		MemberID:    mID,
		CommitteeID: cID,
	})
	if err != nil {
		return false, fmt.Errorf("is member active on committee: %w", err)
	}
	return active, nil
}

// requireSignedIn returns auth.ErrUnauthenticated unless the caller is a
// signed-in member - the member directory's bar, for reads that name
// members.
func requireSignedIn(ctx context.Context) error {
	identity, ok := auth.FromContext(ctx)
	if !ok || identity.MemberID == "" {
		return auth.ErrUnauthenticated
	}
	return nil
}

// PhadderRoleFor reports studentID's PhadderRole and, if any, the group
// they hold it in - collapsing the old dual-path lookup (members.
// nollning_group_id for "nolla", a mandate-based scan for "phadder") into
// one answer. A member can in principle be both; nolla takes precedence
// since that's the more common case this endpoint exists for (the nolla's
// own layout looking up their own group). Signed-in members only.
func (s *Service) PhadderRoleFor(
	ctx context.Context,
	studentID string,
) (PhadderRole, *string, error) {
	if err := requireSignedIn(ctx); err != nil {
		return PhadderRoleNone, nil, err
	}
	member, err := s.queries.GetMemberByStudentID(ctx, pgtype.Text{String: studentID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PhadderRoleNone, nil, ErrNotFound
		}
		return PhadderRoleNone, nil, fmt.Errorf("get member: %w", err)
	}

	nollaGroupID, err := s.queries.GetMemberNollaGroupID(ctx, member.ID)
	if err != nil {
		return PhadderRoleNone, nil, fmt.Errorf("get nolla group: %w", err)
	}
	if nollaGroupID.Valid {
		id := dbutil.UUIDStr(nollaGroupID)
		return PhadderRoleNolla, &id, nil
	}

	phadderGroupID, err := s.queries.GetMemberPhadderGroupID(ctx, member.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PhadderRoleNone, nil, nil
		}
		return PhadderRoleNone, nil, fmt.Errorf("get phadder group: %w", err)
	}
	id := dbutil.UUIDStr(phadderGroupID)
	return PhadderRolePhadder, &id, nil
}

// ListSeasons/CreateSeason/UpdateSeason: admin CRUD for nollning_seasons,
// gated on apinames.NollningSeasonManage - replaces the old AdminSetting-
// backed nollning_start/nollning_end keys.

func (s *Service) ListSeasons(ctx context.Context) ([]NollningSeason, error) {
	rows, err := s.queries.ListSeasons(ctx)
	if err != nil {
		return nil, fmt.Errorf("list seasons: %w", err)
	}
	seasons := make([]NollningSeason, len(rows))
	for i, row := range rows {
		seasons[i] = toSeason(row)
	}
	return seasons, nil
}

// CreateSeason resolves OrganizingCommitteeID from the committee whose
// short_name is "nollu" when the caller doesn't supply one - a per-season,
// overridable FK rather than a hardcoded package constant.
func (s *Service) CreateSeason(
	ctx context.Context,
	in NollningSeasonInput,
) (*NollningSeason, error) {
	if err := auth.Require(ctx, apinames.NollningSeasonManage); err != nil {
		return nil, err
	}

	if err := s.validateSeason(ctx, pgtype.UUID{}, in); err != nil {
		return nil, err
	}
	committeeID, err := s.resolveOrganizingCommittee(ctx, in.OrganizingCommitteeID)
	if err != nil {
		return nil, err
	}

	created, err := s.queries.CreateSeason(ctx, db.CreateSeasonParams{
		Year:                  int32(in.Year),
		NollaStartAt:          dbutil.ToTimestamptz(&in.NollaStartAt),
		RevealAt:              dbutil.ToTimestamptz(&in.RevealAt),
		EndAt:                 dbutil.ToTimestamptz(&in.EndAt),
		OrganizingCommitteeID: committeeID,
	})
	if err != nil {
		if isUniqueViolation(err) {
			return nil, fmt.Errorf("%w: %d", ErrYearTaken, in.Year)
		}
		return nil, fmt.Errorf("create season: %w", err)
	}
	forgetCurrent(ctx)
	season := toSeason(created)
	return &season, nil
}

func (s *Service) UpdateSeason(
	ctx context.Context,
	id string,
	in NollningSeasonInput,
) (*NollningSeason, error) {
	if err := auth.Require(ctx, apinames.NollningSeasonManage); err != nil {
		return nil, err
	}

	seasonID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid season id: %v", err)
	}
	if _, err := s.queries.GetSeason(ctx, seasonID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get season: %w", err)
	}
	if err := s.validateSeason(ctx, seasonID, in); err != nil {
		return nil, err
	}

	committeeID, err := s.resolveOrganizingCommittee(ctx, in.OrganizingCommitteeID)
	if err != nil {
		return nil, err
	}

	updated, err := s.queries.UpdateSeason(ctx, db.UpdateSeasonParams{
		ID:                    seasonID,
		Year:                  int32(in.Year),
		NollaStartAt:          dbutil.ToTimestamptz(&in.NollaStartAt),
		RevealAt:              dbutil.ToTimestamptz(&in.RevealAt),
		EndAt:                 dbutil.ToTimestamptz(&in.EndAt),
		OrganizingCommitteeID: committeeID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		if isUniqueViolation(err) {
			return nil, fmt.Errorf("%w: %d", ErrYearTaken, in.Year)
		}
		return nil, fmt.Errorf("update season: %w", err)
	}
	forgetCurrent(ctx)
	season := toSeason(updated)
	return &season, nil
}

// validateSeason checks a season's dates are in order, that its year is
// free and that it overlaps no other season (excluding the one being
// updated): GetCurrentSeason assumes at most one season is active at a
// time.
func (s *Service) validateSeason(
	ctx context.Context,
	excludeID pgtype.UUID,
	in NollningSeasonInput,
) error {
	if in.RevealAt.Before(in.NollaStartAt) {
		return invalidf("revealAt is before nollaStartAt")
	}
	if in.EndAt.Before(in.RevealAt) {
		return invalidf("endAt is before revealAt")
	}
	if !in.EndAt.After(in.NollaStartAt) {
		return invalidf("endAt must be after nollaStartAt")
	}
	taken, err := s.queries.SeasonYearTaken(ctx, db.SeasonYearTakenParams{
		Year:      int32(in.Year),
		ExcludeID: excludeID,
	})
	if err != nil {
		return fmt.Errorf("check season year: %w", err)
	}
	if taken {
		return fmt.Errorf("%w: %d", ErrYearTaken, in.Year)
	}
	year, err := s.queries.FindOverlappingSeason(ctx, db.FindOverlappingSeasonParams{
		ExcludeID: excludeID,
		StartAt:   dbutil.ToTimestamptz(&in.NollaStartAt),
		EndAt:     dbutil.ToTimestamptz(&in.EndAt),
	})
	switch {
	case err == nil:
		return invalidf("overlaps the %d season", year)
	case !errors.Is(err, pgx.ErrNoRows):
		return fmt.Errorf("find overlapping season: %w", err)
	}
	return nil
}

// isUniqueViolation reports whether err is Postgres refusing a duplicate
// (the year check above can race with a concurrent write).
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505" // unique_violation
}

// requireSeason answers 422 for a season id that doesn't exist, which the
// phadder_groups foreign key would otherwise turn into a 500.
func (s *Service) requireSeason(ctx context.Context, id pgtype.UUID) error {
	if _, err := s.queries.GetSeason(ctx, id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return invalidf("season not found")
		}
		return fmt.Errorf("get season: %w", err)
	}
	return nil
}

func (s *Service) resolveOrganizingCommittee(
	ctx context.Context,
	explicit *string,
) (pgtype.UUID, error) {
	if explicit != nil {
		id, err := dbutil.ParseUUID(*explicit)
		if err != nil {
			return pgtype.UUID{}, invalidf("invalid organizing committee id: %v", err)
		}
		exists, err := s.queries.CommitteeExists(ctx, id)
		if err != nil {
			return pgtype.UUID{}, fmt.Errorf("check organizing committee: %w", err)
		}
		if !exists {
			return pgtype.UUID{}, invalidf("organizing committee not found")
		}
		return id, nil
	}
	nollu, err := s.queries.GetCommitteeByShortName(ctx, pgtype.Text{String: "nollu", Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// No "nollu" committee in this environment (e.g. a fresh dev
			// DB) - leave unset rather than failing season creation
			// outright; an admin can set it explicitly via UpdateSeason.
			return pgtype.UUID{}, nil
		}
		return pgtype.UUID{}, fmt.Errorf("look up nollu committee: %w", err)
	}
	return nollu.ID, nil
}

// ListGroups/GetGroup/CreateGroup/UpdateGroup/DeleteGroup and the nolla/
// phadder membership methods below mirror
// committees/nollu/groups/manage/+page.server.ts's six actions exactly.

func (s *Service) ListGroups(ctx context.Context, seasonID *string) ([]PhadderGroup, error) {
	seasonUUID, err := dbutil.ParseUUIDPtr(seasonID)
	if err != nil {
		return nil, invalidf("invalid season id: %v", err)
	}
	rows, err := s.queries.ListPhadderGroups(ctx, seasonUUID)
	if err != nil {
		return nil, fmt.Errorf("list phadder groups: %w", err)
	}
	groups := make([]PhadderGroup, len(rows))
	for i, row := range rows {
		group := toPhadderGroup(db.PhadderGroup{
			ID:          row.ID,
			Name:        row.Name,
			Description: row.Description,
			ImageUrl:    row.ImageUrl,
			CreatedAt:   row.CreatedAt,
			SeasonID:    row.SeasonID,
		})
		nollaCount := row.NollaCount
		phadderCount := row.PhadderCount
		group.NollaCount = &nollaCount
		group.PhadderCount = &phadderCount
		groups[i] = group
	}
	return groups, nil
}

// GetGroup returns a group with its nollor and phaddrar. Those are member
// names, so like the member directory it is for signed-in members only;
// ListGroups (counts only) stays public.
func (s *Service) GetGroup(ctx context.Context, id string) (*PhadderGroup, error) {
	if err := requireSignedIn(ctx); err != nil {
		return nil, err
	}
	groupID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid group id: %v", err)
	}
	row, err := s.queries.GetPhadderGroup(ctx, groupID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get phadder group: %w", err)
	}
	group := toPhadderGroup(row)

	nollor, err := s.queries.ListNollorForGroup(ctx, groupID)
	if err != nil {
		return nil, fmt.Errorf("list nollor: %w", err)
	}
	group.Nollor = make([]apitypes.Member, len(nollor))
	for i, m := range nollor {
		group.Nollor[i] = toMember(memberRow(m))
	}

	phaddrar, err := s.queries.ListPhaddrarForGroup(ctx, groupID)
	if err != nil {
		return nil, fmt.Errorf("list phaddrar: %w", err)
	}
	group.Phaddrar = make([]apitypes.Member, len(phaddrar))
	for i, m := range phaddrar {
		group.Phaddrar[i] = toMember(memberRow(m))
	}

	return &group, nil
}

func (s *Service) CreateGroup(ctx context.Context, in PhadderGroupInput) (*PhadderGroup, error) {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return nil, err
	}
	seasonID, err := dbutil.ParseUUID(in.SeasonID)
	if err != nil {
		return nil, invalidf("invalid season id: %v", err)
	}
	if err := s.requireSeason(ctx, seasonID); err != nil {
		return nil, err
	}
	created, err := s.queries.CreatePhadderGroup(ctx, db.CreatePhadderGroupParams{
		Name:        in.Name,
		Description: dbutil.ToText(s.sanitizeDescription(in.Description)),
		ImageUrl:    dbutil.ToText(in.ImageURL),
		SeasonID:    seasonID,
	})
	if err != nil {
		return nil, fmt.Errorf("create phadder group: %w", err)
	}
	group := toPhadderGroup(created)
	return &group, nil
}

func (s *Service) UpdateGroup(
	ctx context.Context,
	id string,
	in PhadderGroupInput,
) (*PhadderGroup, error) {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return nil, err
	}
	groupID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid group id: %v", err)
	}
	seasonID, err := dbutil.ParseUUID(in.SeasonID)
	if err != nil {
		return nil, invalidf("invalid season id: %v", err)
	}
	if err := s.requireSeason(ctx, seasonID); err != nil {
		return nil, err
	}
	updated, err := s.queries.UpdatePhadderGroup(ctx, db.UpdatePhadderGroupParams{
		ID:          groupID,
		Name:        in.Name,
		Description: dbutil.ToText(s.sanitizeDescription(in.Description)),
		ImageUrl:    dbutil.ToText(in.ImageURL),
		SeasonID:    seasonID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update phadder group: %w", err)
	}
	group := toPhadderGroup(updated)
	return &group, nil
}

func (s *Service) DeleteGroup(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return err
	}
	groupID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid group id: %v", err)
	}
	if _, err := s.queries.GetPhadderGroup(ctx, groupID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("find phadder group: %w", err)
	}
	if err := s.queries.DeletePhadderGroup(ctx, groupID); err != nil {
		return fmt.Errorf("delete phadder group: %w", err)
	}
	return nil
}

// AddNollor/RemoveNolla set/clear members.nollning_group_id - the
// direct-relation half of the old dual-path model. Members are addressed
// by student id (the manage page's member picker gives those, upstream
// #1291), and adding takes several at once: every student id must exist
// or nothing is added.

func (s *Service) AddNollor(ctx context.Context, groupID string, studentIDs []string) error {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return err
	}
	gID, err := dbutil.ParseUUID(groupID)
	if err != nil {
		return invalidf("invalid group id: %v", err)
	}
	if _, err := s.queries.GetPhadderGroup(ctx, gID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get phadder group: %w", err)
	}
	members, err := s.membersByStudentID(ctx, studentIDs)
	if err != nil {
		return err
	}
	for _, m := range members {
		if err := s.queries.SetMemberPhadderGroup(ctx, db.SetMemberPhadderGroupParams{
			ID: m.ID, NollningGroupID: gID,
		}); err != nil {
			return fmt.Errorf("add nolla: %w", err)
		}
	}
	return nil
}

func (s *Service) RemoveNolla(ctx context.Context, groupID, studentID string) error {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return err
	}
	gID, err := dbutil.ParseUUID(groupID)
	if err != nil {
		return invalidf("invalid group id: %v", err)
	}
	members, err := s.membersByStudentID(ctx, []string{studentID})
	if err != nil {
		return err
	}
	if err := s.queries.ClearMemberPhadderGroup(ctx, db.ClearMemberPhadderGroupParams{
		ID: members[0].ID, NollningGroupID: gID,
	}); err != nil {
		return fmt.Errorf("remove nolla: %w", err)
	}
	return nil
}

// SetMemberGroup puts studentID in phadder group groupID, or takes them
// out of whichever group they're in when groupID is nil or empty. The
// member themselves may do this (the old Member model let a member update
// their own nollningGroupId), as may NollningPhadderGroupsManage. Only
// groups of the current season can be picked: last year's groups are
// history, and outside a season there's nothing to join.
func (s *Service) SetMemberGroup(ctx context.Context, studentID string, groupID *string) error {
	identity, ok := auth.FromContext(ctx)
	if !ok || identity.MemberID == "" {
		return auth.ErrUnauthenticated
	}
	if identity.StudentID != studentID {
		if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
			return err
		}
	}
	member, err := s.queries.GetMemberByStudentID(ctx, pgtype.Text{String: studentID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get member: %w", err)
	}

	var gID pgtype.UUID
	if groupID != nil && *groupID != "" {
		gID, err = dbutil.ParseUUID(*groupID)
		if err != nil {
			return invalidf("invalid group id: %v", err)
		}
		group, err := s.queries.GetPhadderGroup(ctx, gID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return invalidf("phadder group not found")
			}
			return fmt.Errorf("get phadder group: %w", err)
		}
		season, err := s.Current(ctx)
		if err != nil {
			return err
		}
		if season == nil || dbutil.UUIDStr(group.SeasonID) != season.ID {
			return invalidf("the phadder group isn't in the current nollning season")
		}
	}
	if err := s.queries.SetMemberPhadderGroup(ctx, db.SetMemberPhadderGroupParams{
		ID: member.ID, NollningGroupID: gID,
	}); err != nil {
		return fmt.Errorf("set phadder group: %w", err)
	}
	return nil
}

// AddPhaddrar/RemovePhadder set/clear mandates.phadderInId on the members'
// phadder/uppdrag mandate(s), scoped to the group's season window (Decision
// #5: this uses the season's real nolla_start_at/end_at instead of the old
// hardcoded Aug 1 - Oct 1 guess phadderMandateFilter used). Adding is
// all-or-nothing like AddNollor; members without such a mandate are named
// in a NotPhadderError.

// NotPhadderError lists the members AddPhaddrar refused because they hold
// no phadder/uppdrag mandate during the group's season.
type NotPhadderError struct {
	Names []string
}

func (e *NotPhadderError) Error() string {
	return fmt.Sprintf(
		"%v: not a phadder that year: %s",
		ErrInvalidInput,
		strings.Join(e.Names, ", "),
	)
}

func (e *NotPhadderError) Unwrap() error { return ErrInvalidInput }

func (s *Service) AddPhaddrar(ctx context.Context, groupID string, studentIDs []string) error {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return err
	}
	gID, err := dbutil.ParseUUID(groupID)
	if err != nil {
		return invalidf("invalid group id: %v", err)
	}
	members, err := s.membersByStudentID(ctx, studentIDs)
	if err != nil {
		return err
	}

	group, err := s.queries.GetPhadderGroup(ctx, gID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("get phadder group: %w", err)
	}
	season, err := s.queries.GetSeason(ctx, group.SeasonID)
	if err != nil {
		return fmt.Errorf("get group season: %w", err)
	}

	mandateIDs := make([]pgtype.UUID, 0, len(members))
	var notPhadder []string
	for _, m := range members {
		mandate, err := s.queries.FindActivePhadderMandate(ctx, db.FindActivePhadderMandateParams{
			MemberID: m.ID,
			// The season's days in Swedish time; the API runs in UTC.
			SeasonStart: pgtype.Date{Time: season.NollaStartAt.Time.In(stockholm), Valid: true},
			SeasonEnd:   pgtype.Date{Time: season.EndAt.Time.In(stockholm), Valid: true},
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				notPhadder = append(notPhadder, strings.TrimSpace(
					m.FirstName.String+" "+m.LastName.String,
				))
				continue
			}
			return fmt.Errorf("find active phadder mandate: %w", err)
		}
		mandateIDs = append(mandateIDs, mandate.ID)
	}
	if len(notPhadder) > 0 {
		return &NotPhadderError{Names: notPhadder}
	}

	for _, id := range mandateIDs {
		if err := s.queries.SetMandatePhadderGroup(ctx, db.SetMandatePhadderGroupParams{
			ID: id, PhadderInId: gID,
		}); err != nil {
			return fmt.Errorf("add phadder: %w", err)
		}
	}
	return nil
}

func (s *Service) RemovePhadder(ctx context.Context, groupID, studentID string) error {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return err
	}
	gID, err := dbutil.ParseUUID(groupID)
	if err != nil {
		return invalidf("invalid group id: %v", err)
	}
	members, err := s.membersByStudentID(ctx, []string{studentID})
	if err != nil {
		return err
	}
	if err := s.queries.ClearMandatePhadderGroupForMember(
		ctx,
		db.ClearMandatePhadderGroupForMemberParams{
			MemberID: members[0].ID, PhadderInId: gID,
		},
	); err != nil {
		return fmt.Errorf("remove phadder: %w", err)
	}
	return nil
}

// membersByStudentID resolves every student id, or fails naming the
// unknown ones.
func (s *Service) membersByStudentID(
	ctx context.Context, studentIDs []string,
) ([]db.GetMemberByStudentIDRow, error) {
	if len(studentIDs) == 0 {
		return nil, invalidf("no members given")
	}
	members := make([]db.GetMemberByStudentIDRow, 0, len(studentIDs))
	var missing []string
	for _, id := range studentIDs {
		m, err := s.queries.GetMemberByStudentID(ctx, pgtype.Text{String: id, Valid: true})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				missing = append(missing, id)
				continue
			}
			return nil, fmt.Errorf("look up member: %w", err)
		}
		members = append(members, m)
	}
	if len(missing) > 0 {
		return nil, invalidf("members not found: %s", strings.Join(missing, ", "))
	}
	return members, nil
}

var stockholm = func() *time.Location {
	loc, err := time.LoadLocation("Europe/Stockholm")
	if err != nil {
		panic(err)
	}
	return loc
}()
