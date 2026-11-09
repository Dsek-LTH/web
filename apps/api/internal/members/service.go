// Package members is the directory-foundation member domain: the member
// list/profile/update endpoints, profile pictures (picture.go) and
// birthdays (birthday.go).
package members

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/apitypes"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/db"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
	"github.com/dsek-lth/web/apps/api/internal/locale"
	"github.com/dsek-lth/web/apps/api/internal/sanitize"
	"github.com/dsek-lth/web/apps/api/internal/storage"
)

var (
	ErrNotFound     = errors.New("members: not found")
	ErrInvalidInput = errors.New("members: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

type Service struct {
	queries       *db.Queries
	sanitizer     *sanitize.Policy
	storage       storage.Backend
	membersBucket string
}

// NewService takes the storage backend and bucket profile pictures live in
// (PUBLIC_BUCKETS_MEMBERS).
func NewService(dbtx db.DBTX, store storage.Backend, membersBucket string) *Service {
	return &Service{
		queries:       db.New(dbtx),
		sanitizer:     sanitize.UGC(),
		storage:       store,
		membersBucket: membersBucket,
	}
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
	// BirthdayToday lists only visible members whose birthday is today,
	// ignoring the other filters. Needs member:user.
	BirthdayToday bool
}

func (s *Service) List(ctx context.Context, params ListParams) ([]MemberProfile, error) {
	identity, err := requireMember(ctx)
	if err != nil {
		return nil, err
	}
	if params.BirthdayToday {
		return s.listBirthdays(ctx, identity)
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

func (s *Service) listBirthdays(
	ctx context.Context,
	identity *auth.Identity,
) ([]MemberProfile, error) {
	if !identity.Has(apinames.MemberUser) {
		return []MemberProfile{}, nil
	}
	rows, err := s.queries.ListVisibleMembersWithBirthDate(ctx)
	if err != nil {
		return nil, fmt.Errorf("list birthdays: %w", err)
	}
	now := time.Now()
	members := []MemberProfile{}
	for _, r := range rows {
		if !BirthdayOn(r.BirthDate, now) {
			continue
		}
		members = append(members, MemberProfile{
			ID:            dbutil.UUIDStr(r.ID),
			StudentID:     dbutil.TextPtr(r.StudentID),
			FirstName:     dbutil.TextPtr(r.FirstName),
			Nickname:      dbutil.TextPtr(r.Nickname),
			LastName:      dbutil.TextPtr(r.LastName),
			PicturePath:   dbutil.TextPtr(r.PicturePath),
			Visible:       true,
			BirthDate:     dbutil.DatePtr(r.BirthDate),
			BirthdayToday: true,
		})
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
	loc := locale.FromContext(ctx)
	mandates := make([]Mandate, len(mandateRows))
	for i, m := range mandateRows {
		var committee *apitypes.Committee
		if m.CommitteeID.Valid {
			committeeNameEn := dbutil.TextPtr(m.CommitteeNameEn)
			committee = &apitypes.Committee{
				ID:        dbutil.UUIDStr(m.CommitteeID),
				Name:      dbutil.ResolveName(m.CommitteeNameSv.String, committeeNameEn, loc),
				NameSv:    m.CommitteeNameSv.String,
				NameEn:    committeeNameEn,
				ShortName: dbutil.TextPtr(m.CommitteeShortName),
				SymbolURL: dbutil.TextPtr(m.CommitteeSymbolUrl),
			}
		}
		var phadderIn *apitypes.MandatePhadderGroup
		if m.PhadderGroupID.Valid {
			phadderIn = &apitypes.MandatePhadderGroup{
				ID:       dbutil.UUIDStr(m.PhadderGroupID),
				Name:     m.PhadderGroupName.String,
				ImageURL: dbutil.TextPtr(m.PhadderGroupImageUrl),
			}
		}
		mandates[i] = Mandate{
			PhadderIn: phadderIn,
			ID:        dbutil.UUIDStr(m.ID),
			StartDate: dbutil.DatePtr(m.StartDate),
			EndDate:   dbutil.DatePtr(m.EndDate),
			Position: &apitypes.Position{
				ID: m.PositionID,
				Name: dbutil.ResolveName(
					m.PositionNameSv,
					dbutil.TextPtr(m.PositionNameEn),
					loc,
				),
				NameSv:      m.PositionNameSv,
				NameEn:      dbutil.TextPtr(m.PositionNameEn),
				CommitteeID: dbutil.UUIDStrPtr(m.CommitteeID),
				Committee:   committee,
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
		Language:       (*apitypes.Language)(dbutil.TextPtr(row.Language)),
		Mandates:       mandates,
	}

	if identity.StudentID == studentID || identity.Has(apinames.MemberSeeEmail) {
		member.Email = dbutil.TextPtr(row.Email)
	}
	if identity.StudentID == studentID || identity.Has(apinames.MemberUser) {
		member.BirthDate = dbutil.DatePtr(row.BirthDate)
		member.BirthdayToday = BirthdayOn(row.BirthDate, time.Now())
	}

	return &member, nil
}

// UpdateProfile full-replaces the profile fields (not food preference, not
// email, not nollningGroupId - see UpdateFoodPreference and
// internal/nollning's phadder-group membership). Authorized as self or
// MemberUpdate - the old TS actions had no server-side check at all here,
// only client-side button-hiding; this is a real fix, not a replicated gap.
func (s *Service) UpdateProfile(
	ctx context.Context,
	studentID string,
	in ProfileInput,
) (*MemberProfile, error) {
	if err := s.authorizeSelfOrUpdate(ctx, studentID); err != nil {
		return nil, err
	}
	var birthDate pgtype.Date
	if in.BirthDate != nil && *in.BirthDate != "" {
		d, err := dbutil.ParseDate(*in.BirthDate)
		if err != nil {
			return nil, invalidf("birthDate must be YYYY-MM-DD")
		}
		if d.Time.After(time.Now()) {
			return nil, invalidf("birthDate can't be in the future")
		}
		birthDate = d
	}

	row, err := s.queries.UpdateMemberProfile(ctx, db.UpdateMemberProfileParams{
		StudentID:      dbutil.ToText(&studentID),
		FirstName:      dbutil.ToText(&in.FirstName),
		LastName:       dbutil.ToText(&in.LastName),
		Nickname:       dbutil.ToText(in.Nickname),
		ClassProgramme: dbutil.ToText(in.ClassProgramme),
		ClassYear:      dbutil.ToInt4(in.ClassYear),
		GraduationYear: dbutil.ToInt4(in.GraduationYear),
		Language:       dbutil.ToText((*string)(in.Language)),
		Bio:            dbutil.ToText(s.sanitizer.SanitizePtr(in.Bio)),
		BirthDate:      birthDate,
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

// UpdateLanguage sets the member's preferred site language, "sv" or "en"
// (what the language switcher saves). Self or core:member:update.
func (s *Service) UpdateLanguage(ctx context.Context, studentID, language string) error {
	if language != "sv" && language != "en" {
		return invalidf("language must be \"sv\" or \"en\"")
	}
	if err := s.authorizeSelfOrUpdate(ctx, studentID); err != nil {
		return err
	}
	n, err := s.queries.UpdateMemberLanguage(ctx, db.UpdateMemberLanguageParams{
		StudentID: dbutil.ToText(&studentID),
		Language:  dbutil.ToText(&language),
	})
	if err != nil {
		return fmt.Errorf("update language: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
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
