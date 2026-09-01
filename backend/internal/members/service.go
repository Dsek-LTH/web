// Package members is the directory-foundation member domain: the member
// list/profile/update endpoints. See backend/DESIGN.md's roadmap "Phase 1:
// directory foundation" for scope and the deliberate cuts (avatar upload,
// medals, ping, door access, subscription settings - each belongs to a
// different, later phase).
package members

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/microcosm-cc/bluemonday"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/apitypes"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/locale"
)

var ErrNotFound = errors.New("members: not found")

type Service struct {
	queries   *db.Queries
	sanitizer *bluemonday.Policy
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx), sanitizer: bluemonday.UGCPolicy()}
}

// requireMember returns the acting identity, or ErrUnauthenticated if the
// caller is anonymous - mirrors the old TS members routes' `if
// (!user?.memberId) error(401)` check. Unlike auth.Require, this isn't
// gating a specific policy - any real member may browse the directory, the
// same "must simply be logged in" bar TS used.
func requireMember(ctx context.Context) (*auth.Identity, error) {
	identity, ok := auth.FromContext(ctx)
	if !ok || identity.MemberID == "" {
		return nil, auth.ErrUnauthenticated
	}
	return identity, nil
}

type ListParams struct {
	ClassYear      *int32
	ClassProgramme *string
}

func (s *Service) List(ctx context.Context, params ListParams) ([]MemberProfile, error) {
	if _, err := requireMember(ctx); err != nil {
		return nil, err
	}
	rows, err := s.queries.ListMembers(ctx, db.ListMembersParams{
		ClassYear:      dbutil.ToInt4(params.ClassYear),
		ClassProgramme: dbutil.ToText(params.ClassProgramme),
	})
	if err != nil {
		return nil, fmt.Errorf("list members: %w", err)
	}
	members := make([]MemberProfile, len(rows))
	for i, r := range rows {
		members[i] = MemberProfile{
			ID:             dbutil.UUIDStr(r.ID),
			StudentID:      dbutil.TextPtr(r.StudentID),
			FirstName:      dbutil.TextPtr(r.FirstName),
			Nickname:       dbutil.TextPtr(r.Nickname),
			LastName:       dbutil.TextPtr(r.LastName),
			PicturePath:    dbutil.TextPtr(r.PicturePath),
			ClassProgramme: dbutil.TextPtr(r.ClassProgramme),
			ClassYear:      dbutil.Int4Ptr(r.ClassYear),
		}
	}
	return members, nil
}

// Profile fetches a member's full profile, including mandate history.
// Email is only resolved if the caller is viewing their own profile or
// holds MemberSeeEmail - matching the old TS behavior exactly.
func (s *Service) Profile(ctx context.Context, studentID string) (*MemberProfile, error) {
	identity, err := requireMember(ctx)
	if err != nil {
		return nil, err
	}

	row, err := s.queries.GetMemberProfile(ctx, dbutil.ToText(&studentID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get member profile: %w", err)
	}

	mandateRows, err := s.queries.ListMandatesForMember(ctx, row.ID)
	if err != nil {
		return nil, fmt.Errorf("list mandates: %w", err)
	}
	mandates := make([]Mandate, len(mandateRows))
	for i, m := range mandateRows {
		mandates[i] = Mandate{
			ID:        dbutil.UUIDStr(m.ID),
			StartDate: dbutil.DatePtr(m.StartDate),
			EndDate:   dbutil.DatePtr(m.EndDate),
			Position: &apitypes.Position{
				ID: m.PositionID,
				Name: dbutil.ResolveName(
					m.PositionNameSv,
					dbutil.TextPtr(m.PositionNameEn),
					locale.FromContext(ctx),
				),
				NameSv:      m.PositionNameSv,
				NameEn:      dbutil.TextPtr(m.PositionNameEn),
				CommitteeID: dbutil.UUIDStrPtr(m.CommitteeID),
			},
		}
	}

	member := MemberProfile{
		ID:             dbutil.UUIDStr(row.ID),
		StudentID:      dbutil.TextPtr(row.StudentID),
		FirstName:      dbutil.TextPtr(row.FirstName),
		Nickname:       dbutil.TextPtr(row.Nickname),
		LastName:       dbutil.TextPtr(row.LastName),
		PicturePath:    dbutil.TextPtr(row.PicturePath),
		ClassProgramme: dbutil.TextPtr(row.ClassProgramme),
		ClassYear:      dbutil.Int4Ptr(row.ClassYear),
		Visible:        row.Visible,
		FoodPreference: dbutil.TextPtr(row.FoodPreference),
		Bio:            dbutil.TextPtr(row.Bio),
		GraduationYear: dbutil.Int4Ptr(row.GraduationYear),
		Language:       dbutil.TextPtr(row.Language),
		Mandates:       mandates,
	}

	if identity.StudentID == studentID || identity.Has(apinames.MemberSeeEmail) {
		member.Email = dbutil.TextPtr(row.Email)
	}

	return &member, nil
}

// UpdateProfile full-replaces the profile fields (not food preference, not
// email, not nollningGroupId - see UpdateFoodPreference and
// backend/DESIGN.md's Phase 2 nollning redesign). Authorized as self or
// MemberUpdate - the old TS actions had no server-side check at all here,
// only client-side button-hiding; this is a real fix, not a replicated gap.
func (s *Service) UpdateProfile(
	ctx context.Context,
	studentID string,
	in UpdateProfileInput,
) (*MemberProfile, error) {
	if err := s.authorizeSelfOrUpdate(ctx, studentID); err != nil {
		return nil, err
	}

	row, err := s.queries.UpdateMemberProfile(ctx, db.UpdateMemberProfileParams{
		StudentID:      dbutil.ToText(&studentID),
		FirstName:      dbutil.ToText(&in.FirstName),
		LastName:       dbutil.ToText(&in.LastName),
		Nickname:       dbutil.ToText(in.Nickname),
		ClassProgramme: dbutil.ToText(in.ClassProgramme),
		ClassYear:      dbutil.ToInt4(in.ClassYear),
		GraduationYear: dbutil.ToInt4(in.GraduationYear),
		Language:       dbutil.ToText(in.Language),
		Bio:            dbutil.ToText(sanitizePtr(s.sanitizer, in.Bio)),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update member profile: %w", err)
	}
	return s.Profile(ctx, dbutil.StringOr(dbutil.TextPtr(row.StudentID), studentID))
}

func (s *Service) UpdateFoodPreference(
	ctx context.Context,
	studentID string,
	foodPreference *string,
) (*MemberProfile, error) {
	if err := s.authorizeSelfOrUpdate(ctx, studentID); err != nil {
		return nil, err
	}
	row, err := s.queries.UpdateMemberFoodPreference(ctx, db.UpdateMemberFoodPreferenceParams{
		StudentID:      dbutil.ToText(&studentID),
		FoodPreference: dbutil.ToText(foodPreference),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update food preference: %w", err)
	}
	return s.Profile(ctx, dbutil.StringOr(dbutil.TextPtr(row.StudentID), studentID))
}

func (s *Service) authorizeSelfOrUpdate(ctx context.Context, studentID string) error {
	identity, err := requireMember(ctx)
	if err != nil {
		return err
	}
	if identity.StudentID == studentID {
		return nil
	}
	return auth.Require(ctx, apinames.MemberUpdate)
}

func sanitizePtr(p *bluemonday.Policy, s *string) *string {
	if s == nil {
		return nil
	}
	sanitized := p.Sanitize(*s)
	return &sanitized
}
