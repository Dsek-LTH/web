// Package elections is the committee-election-announcement domain behind
// /elections - see DESIGN.md's "Elections" section (roadmap Phase 7).
// Ported from src/routes/(app)/elections/*. Despite the roadmap's original
// "nomination/voting workflow" description, this feature has no in-house
// ballot mechanism at all - Election.link just points to an external form
// (Google Forms or similar); actual voting never touches this backend. See
// DESIGN.md for the correction and what "yrka" (motion submission, a plain
// email send with no DB model) and ItemQuestion (actually part of the
// already-cut-from-scope shop/ticket domain) turned out to really be.
package elections

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
	"github.com/dsek-lth/web/backend/internal/locale"
)

var (
	ErrNotFound     = errors.New("elections: not found")
	ErrInvalidInput = errors.New("elections: invalid input")
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

// List is a public read (matches the old ZModel's @@allow("read", true)) -
// only elections that haven't expired yet, soonest-closing first, matching
// the old /elections page exactly. There is no "all elections, including
// expired" listing anywhere in the old app either - once an election
// expires it drops out of every list, including its own edit-page link.
func (s *Service) List(ctx context.Context) ([]Election, error) {
	rows, err := s.queries.ListOpenElections(ctx)
	if err != nil {
		return nil, fmt.Errorf("list elections: %w", err)
	}
	loc := locale.FromContext(ctx)
	out := make([]Election, len(rows))
	for i, row := range rows {
		out[i] = toElection(electionRow(row), loc)
	}
	return out, nil
}

// Get is also a public read, unconstrained by expiry - used by the edit
// page to look up an election regardless of whether it has already
// expired, matching prisma.election.findFirst({where: {id}}).
func (s *Service) Get(ctx context.Context, id string) (*Election, error) {
	electionID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid id: %v", err)
	}
	row, err := s.queries.GetElectionByID(ctx, electionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get election: %w", err)
	}
	loc := locale.FromContext(ctx)
	e := toElection(electionRow(row), loc)
	return &e, nil
}

// Create requires ElectionCreate - a real, necessary explicit check to add:
// the old app's create action had no authorize() call at all, relying
// purely on ZenStack's model-level @@allow policy. Go has no such fallback
// layer.
func (s *Service) Create(ctx context.Context, in ElectionInput) (*Election, error) {
	if err := auth.Require(ctx, apinames.ElectionCreate); err != nil {
		return nil, err
	}
	if err := validate(in); err != nil {
		return nil, err
	}
	committeeID, err := dbutil.ParseUUID(in.CommitteeID)
	if err != nil {
		return nil, invalidf("invalid committeeId: %v", err)
	}
	row, err := s.queries.CreateElection(ctx, db.CreateElectionParams{
		CommitteeID: committeeID,
		MarkdownSv:  in.MarkdownSv,
		MarkdownEn:  dbutil.ToText(in.MarkdownEn),
		Link:        in.Link,
		ExpiresAt:   dbutil.ToTimestamptz(&in.ExpiresAt),
	})
	if err != nil {
		return nil, fmt.Errorf("create election: %w", err)
	}
	return s.Get(ctx, dbutil.UUIDStr(row.ID))
}

// Update requires ElectionUpdate - same "old app had no explicit check"
// note as Create above. Full-replace (every field must be resent),
// matching articles/events/songs/booking's own update convention.
func (s *Service) Update(ctx context.Context, id string, in ElectionInput) (*Election, error) {
	if err := auth.Require(ctx, apinames.ElectionUpdate); err != nil {
		return nil, err
	}
	if err := validate(in); err != nil {
		return nil, err
	}
	electionID, err := dbutil.ParseUUID(id)
	if err != nil {
		return nil, invalidf("invalid id: %v", err)
	}
	committeeID, err := dbutil.ParseUUID(in.CommitteeID)
	if err != nil {
		return nil, invalidf("invalid committeeId: %v", err)
	}
	if _, err := s.queries.UpdateElection(ctx, db.UpdateElectionParams{
		ID:          electionID,
		CommitteeID: committeeID,
		MarkdownSv:  in.MarkdownSv,
		MarkdownEn:  dbutil.ToText(in.MarkdownEn),
		Link:        in.Link,
		ExpiresAt:   dbutil.ToTimestamptz(&in.ExpiresAt),
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update election: %w", err)
	}
	return s.Get(ctx, id)
}

// Delete requires ElectionDelete - a hard delete, since the elections table
// has no removed_at/deleted_at column at all. No frontend consumer exists
// for this in the old app (there was never a delete button anywhere), but
// the policy string already existed unused in apiNames.ts's crud("election")
// group - wiring it up is a genuinely new capability, not a replicated
// gap, same call as Booking's bookable/category CRUD.
func (s *Service) Delete(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.ElectionDelete); err != nil {
		return err
	}
	electionID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid id: %v", err)
	}
	n, err := s.queries.DeleteElection(ctx, electionID)
	if err != nil {
		return fmt.Errorf("delete election: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func validate(in ElectionInput) error {
	if in.CommitteeID == "" {
		return invalidf("committeeId is required")
	}
	if in.MarkdownSv == "" {
		return invalidf("markdownSv is required")
	}
	if in.Link == "" {
		return invalidf("link is required")
	}
	if in.ExpiresAt.IsZero() {
		return invalidf("expiresAt is required")
	}
	return nil
}
