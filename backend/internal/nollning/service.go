package nollning

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/apitypes"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

type Service struct {
	queries *db.Queries
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx)}
}

// Current returns the season whose window covers right now, or nil (not an
// error) if none does.
func (s *Service) Current(ctx context.Context) (*Season, error) {
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

func phaseFor(season *Season) Phase {
	if season == nil {
		return PhaseOff
	}
	if time.Now().Before(season.RevealAt) {
		return PhasePreReveal
	}
	return PhasePostReveal
}

// GetCurrent backs GET /nollning/current - phase and active season (if
// any) in one call.
func (s *Service) GetCurrent(ctx context.Context) (*CurrentInfo, error) {
	season, err := s.Current(ctx)
	if err != nil {
		return nil, err
	}
	return &CurrentInfo{Phase: phaseFor(season), Season: season}, nil
}

// NollaYear is the year auth.DerivedRoles' "nolla" pseudo-role should
// compare a member's classYear against: the current season's year if one
// is active, else the calendar year (see DESIGN.md's decision #3 - a
// season boundary crossing a calendar year, e.g. starting in August,
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
// generic policy fetch (see DESIGN.md's decision on SEE_STABEN).
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

// PhadderRoleFor reports studentID's PhadderRole and, if any, the group
// they hold it in - collapsing the old dual-path lookup (members.
// nollning_group_id for "nolla", a mandate-based scan for "phadder") into
// one answer. A member can in principle be both; nolla takes precedence
// since that's the more common case this endpoint exists for (the nolla's
// own layout looking up their own group).
func (s *Service) PhadderRoleFor(
	ctx context.Context,
	studentID string,
) (PhadderRole, *string, error) {
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

func (s *Service) ListSeasons(ctx context.Context) ([]Season, error) {
	rows, err := s.queries.ListSeasons(ctx)
	if err != nil {
		return nil, fmt.Errorf("list seasons: %w", err)
	}
	seasons := make([]Season, len(rows))
	for i, row := range rows {
		seasons[i] = toSeason(row)
	}
	return seasons, nil
}

// CreateSeason resolves OrganizingCommitteeID from the committee whose
// short_name is "nollu" when the caller doesn't supply one - see
// DESIGN.md's decision #2 (a per-season, overridable FK rather than a
// hardcoded package constant).
func (s *Service) CreateSeason(ctx context.Context, in SeasonInput) (*Season, error) {
	if err := auth.Require(ctx, apinames.NollningSeasonManage); err != nil {
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
		return nil, fmt.Errorf("create season: %w", err)
	}
	season := toSeason(created)
	return &season, nil
}

func (s *Service) UpdateSeason(ctx context.Context, id string, in SeasonInput) (*Season, error) {
	if err := auth.Require(ctx, apinames.NollningSeasonManage); err != nil {
		return nil, err
	}

	seasonID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid season id: %v", err)
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
		return nil, fmt.Errorf("update season: %w", err)
	}
	season := toSeason(updated)
	return &season, nil
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
// committees/nollu/groups/manage/+page.server.ts's six actions exactly -
// see DESIGN.md's phadder-group section.

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

func (s *Service) GetGroup(ctx context.Context, id string) (*PhadderGroup, error) {
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
	created, err := s.queries.CreatePhadderGroup(ctx, db.CreatePhadderGroupParams{
		Name:        in.Name,
		Description: dbutil.ToText(in.Description),
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
	updated, err := s.queries.UpdatePhadderGroup(ctx, db.UpdatePhadderGroupParams{
		ID:          groupID,
		Name:        in.Name,
		Description: dbutil.ToText(in.Description),
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

// AddNolla/RemoveNolla set/clear a member's members.nollning_group_id -
// the direct-relation half of the old dual-path model.

func (s *Service) AddNolla(ctx context.Context, groupID, memberID string) error {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return err
	}
	gID, mID, err := parseGroupAndMember(groupID, memberID)
	if err != nil {
		return err
	}
	if err := s.queries.SetMemberPhadderGroup(ctx, db.SetMemberPhadderGroupParams{
		ID: mID, NollningGroupID: gID,
	}); err != nil {
		return fmt.Errorf("add nolla: %w", err)
	}
	return nil
}

func (s *Service) RemoveNolla(ctx context.Context, groupID, memberID string) error {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return err
	}
	gID, mID, err := parseGroupAndMember(groupID, memberID)
	if err != nil {
		return err
	}
	if err := s.queries.ClearMemberPhadderGroup(ctx, db.ClearMemberPhadderGroupParams{
		ID: mID, NollningGroupID: gID,
	}); err != nil {
		return fmt.Errorf("remove nolla: %w", err)
	}
	return nil
}

// AddPhadder/RemovePhadder set/clear mandates.phadderInId on the member's
// phadder/uppdrag mandate(s), scoped to the group's season window (Decision
// #5: this uses the season's real nolla_start_at/end_at instead of the old
// hardcoded Aug 1 - Oct 1 guess phadderMandateFilter used).

func (s *Service) AddPhadder(ctx context.Context, groupID, memberID string) error {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return err
	}
	gID, mID, err := parseGroupAndMember(groupID, memberID)
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

	mandate, err := s.queries.FindActivePhadderMandate(ctx, db.FindActivePhadderMandateParams{
		MemberID:  mID,
		StartDate: pgtype.Date{Time: season.NollaStartAt.Time, Valid: true},
		EndDate:   pgtype.Date{Time: season.EndAt.Time, Valid: true},
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return invalidf("member has no phadder/uppdrag mandate for this group's season")
		}
		return fmt.Errorf("find active phadder mandate: %w", err)
	}

	if err := s.queries.SetMandatePhadderGroup(ctx, db.SetMandatePhadderGroupParams{
		ID: mandate.ID, PhadderInId: gID,
	}); err != nil {
		return fmt.Errorf("add phadder: %w", err)
	}
	return nil
}

func (s *Service) RemovePhadder(ctx context.Context, groupID, memberID string) error {
	if err := auth.Require(ctx, apinames.NollningPhadderGroupsManage); err != nil {
		return err
	}
	gID, mID, err := parseGroupAndMember(groupID, memberID)
	if err != nil {
		return err
	}
	if err := s.queries.ClearMandatePhadderGroupForMember(
		ctx,
		db.ClearMandatePhadderGroupForMemberParams{
			MemberID: mID, PhadderInId: gID,
		},
	); err != nil {
		return fmt.Errorf("remove phadder: %w", err)
	}
	return nil
}

func parseGroupAndMember(groupID, memberID string) (pgtype.UUID, pgtype.UUID, error) {
	gID, err := dbutil.ParseUUID(groupID)
	if err != nil {
		return pgtype.UUID{}, pgtype.UUID{}, invalidf("invalid group id: %v", err)
	}
	mID, err := dbutil.ParseUUID(memberID)
	if err != nil {
		return pgtype.UUID{}, pgtype.UUID{}, invalidf("invalid member id: %v", err)
	}
	return gID, mID, nil
}
