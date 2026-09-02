// Package alerts is the site-wide banner-message domain - see DESIGN.md's
// Phase 3 ("Simple standalone CRUD") section. Ported from
// src/routes/(app)/admin/alerts and the old api/closeAlert endpoint.
package alerts

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
	ErrNotFound     = errors.New("alerts: not found")
	ErrInvalidInput = errors.New("alerts: invalid input")
)

func invalidf(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidInput}, args...)...)
}

// validSeverities mirrors the old app's zod enum - Alert.svelte's
// severity-to-icon map has no fallback for anything else.
var validSeverities = map[string]bool{
	"info": true, "success": true, "warning": true, "error": true,
}

type Service struct {
	queries *db.Queries
}

func NewService(dbtx db.DBTX) *Service {
	return &Service{queries: db.New(dbtx)}
}

// List is a public read (matches the old ZModel's @@allow("read", true)) -
// non-removed alerts, each with ClosedByMe resolved for the acting identity
// when one exists (false for an anonymous caller, same as "hasn't closed
// it").
func (s *Service) List(ctx context.Context) ([]Alert, error) {
	rows, err := s.queries.ListActiveAlerts(ctx)
	if err != nil {
		return nil, fmt.Errorf("list alerts: %w", err)
	}

	closed := map[string]bool{}
	if identity, ok := auth.FromContext(ctx); ok && identity.MemberID != "" {
		memberID, err := dbutil.ParseUUID(identity.MemberID)
		if err == nil {
			ids, err := s.queries.ListClosedAlertIDsForMember(ctx, memberID)
			if err != nil {
				return nil, fmt.Errorf("list closed alerts: %w", err)
			}
			for _, id := range ids {
				closed[dbutil.UUIDStr(id)] = true
			}
		}
	}

	loc := locale.FromContext(ctx)
	out := make([]Alert, len(rows))
	for i, row := range rows {
		id := dbutil.UUIDStr(row.ID)
		out[i] = Alert{
			ID:         id,
			Severity:   row.Severity,
			Message:    dbutil.ResolveName(row.MessageSv, &row.MessageEn, loc),
			MessageSv:  row.MessageSv,
			MessageEn:  row.MessageEn,
			CreatedAt:  row.CreatedAt.Time,
			ClosedByMe: closed[id],
		}
	}
	return out, nil
}

func (s *Service) Create(ctx context.Context, in AlertInput) (*Alert, error) {
	if err := auth.Require(ctx, apinames.AlertManage); err != nil {
		return nil, err
	}
	if !validSeverities[in.Severity] {
		return nil, invalidf("invalid severity %q", in.Severity)
	}
	if in.MessageSv == "" || in.MessageEn == "" {
		return nil, invalidf("messageSv and messageEn are required")
	}

	row, err := s.queries.CreateAlert(ctx, db.CreateAlertParams{
		Severity:  in.Severity,
		MessageSv: in.MessageSv,
		MessageEn: in.MessageEn,
	})
	if err != nil {
		return nil, fmt.Errorf("create alert: %w", err)
	}

	loc := locale.FromContext(ctx)
	return &Alert{
		ID:        dbutil.UUIDStr(row.ID),
		Severity:  row.Severity,
		Message:   dbutil.ResolveName(row.MessageSv, &row.MessageEn, loc),
		MessageSv: row.MessageSv,
		MessageEn: row.MessageEn,
		CreatedAt: row.CreatedAt.Time,
	}, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	if err := auth.Require(ctx, apinames.AlertManage); err != nil {
		return err
	}
	alertID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid id: %v", err)
	}
	if err := s.queries.SoftDeleteAlert(ctx, alertID); err != nil {
		return fmt.Errorf("delete alert: %w", err)
	}
	return nil
}

// Close records the acting member's dismissal of an alert - a self-service
// action requiring only a real (non-anonymous) identity, not AlertManage,
// matching the old api/closeAlert endpoint's actual behavior (it had no
// explicit authorize() call at all - any logged-in member could close any
// alert for themselves; that's the real gate being replicated here, not a
// gap being introduced).
func (s *Service) Close(ctx context.Context, id string) error {
	identity, ok := auth.FromContext(ctx)
	if !ok || identity.MemberID == "" {
		return auth.ErrUnauthenticated
	}
	alertID, err := dbutil.ParseUUID(id)
	if err != nil {
		return invalidf("invalid id: %v", err)
	}
	memberID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return fmt.Errorf("parse member id: %w", err)
	}
	if err := s.queries.CloseAlertForMember(ctx, db.CloseAlertForMemberParams{
		A: alertID,
		B: memberID,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("close alert: %w", err)
	}
	return nil
}
