// Package accesspolicies is the small admin CRUD over api_access_policies
// (grants an apiName to a role or a specific member) - see
// backend/DESIGN.md's roadmap "Phase 1: directory foundation".
package accesspolicies

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

var (
	ErrNotFound     = errors.New("accesspolicies: not found")
	ErrInvalidInput = errors.New("accesspolicies: invalid input")
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

func (s *Service) List(ctx context.Context, apiName *string) ([]AccessPolicy, error) {
	if err := auth.Require(ctx, apinames.AccessPolicyRead); err != nil {
		return nil, err
	}
	rows, err := s.queries.ListAccessPolicies(ctx, dbutil.ToText(apiName))
	if err != nil {
		return nil, fmt.Errorf("list access policies: %w", err)
	}
	policies := make([]AccessPolicy, len(rows))
	for i, r := range rows {
		policies[i] = AccessPolicy{
			ID:              dbutil.UUIDStr(r.ID),
			APIName:         r.ApiName,
			Role:            dbutil.TextPtr(r.Role),
			StudentID:       dbutil.TextPtr(r.StudentID),
			CreatedAt:       r.CreatedAt.Time,
			MemberFirstName: dbutil.TextPtr(r.MemberFirstName),
			MemberLastName:  dbutil.TextPtr(r.MemberLastName),
		}
	}
	return policies, nil
}

func (s *Service) ListDistinctAPINames(ctx context.Context) ([]string, error) {
	if err := auth.Require(ctx, apinames.AccessPolicyRead); err != nil {
		return nil, err
	}
	names, err := s.queries.ListDistinctAPINames(ctx)
	if err != nil {
		return nil, fmt.Errorf("list distinct api names: %w", err)
	}
	return names, nil
}

// Create grants in.APIName to exactly one of in.Role/in.StudentID. Mirrors
// the old TS admin form's zod .refine() (exactly one, never both, never
// neither) plus its "does this member exist" check - kept here too, not
// just left to the new DB CHECK constraint, so a bad request gets a clean
// 400/404 instead of a raw constraint-violation error.
func (s *Service) Create(ctx context.Context, in CreateInput) (*AccessPolicy, error) {
	if err := auth.Require(ctx, apinames.AccessPolicyCreate); err != nil {
		return nil, err
	}
	hasRole := in.Role != nil && *in.Role != ""
	hasStudentID := in.StudentID != nil && *in.StudentID != ""
	if hasRole == hasStudentID {
		return nil, invalidf("exactly one of role or studentId must be set")
	}
	if hasStudentID {
		if _, err := s.queries.GetMemberByStudentID(ctx, dbutil.ToText(in.StudentID)); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, invalidf("no member with studentId %q", *in.StudentID)
			}
			return nil, fmt.Errorf("look up member: %w", err)
		}
	}

	row, err := s.queries.CreateAccessPolicy(ctx, db.CreateAccessPolicyParams{
		ApiName:   in.APIName,
		Role:      dbutil.ToText(in.Role),
		StudentID: dbutil.ToText(in.StudentID),
	})
	if err != nil {
		return nil, fmt.Errorf("create access policy: %w", err)
	}
	return &AccessPolicy{
		ID:        dbutil.UUIDStr(row.ID),
		APIName:   row.ApiName,
		Role:      dbutil.TextPtr(row.Role),
		StudentID: dbutil.TextPtr(row.StudentID),
		CreatedAt: row.CreatedAt.Time,
	}, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.AccessPolicyDelete); err != nil {
		return err
	}
	policyID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid id: %v", err)
	}
	if err := s.queries.DeleteAccessPolicy(ctx, policyID); err != nil {
		return fmt.Errorf("delete access policy: %w", err)
	}
	return nil
}
