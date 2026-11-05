// Package pings lets one member "ping" another: a counter per pair of
// members plus a notification to the receiver. Ported from
// src/routes/(app)/members/[studentId]/pings.ts.
package pings

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/backend/internal/apinames"
	"github.com/dsek-lth/web/apps/backend/internal/auth"
	"github.com/dsek-lth/web/apps/backend/internal/db"
	"github.com/dsek-lth/web/apps/backend/internal/dbutil"
	"github.com/dsek-lth/web/apps/backend/internal/integrations"
)

var (
	ErrNotFound     = errors.New("pings: not found")
	ErrInvalidInput = errors.New("pings: invalid input")
)

type Service struct {
	queries  *db.Queries
	notifier integrations.Notifier
}

func NewService(dbtx db.DBTX, notifier integrations.Notifier) *Service {
	return &Service{queries: db.New(dbtx), notifier: notifier}
}

// Ping records a ping from the acting member to the member with studentID
// and notifies them. The pair shares one row, which keeps the direction of
// the first ping between them.
func (s *Service) Ping(ctx context.Context, studentID string) error {
	if err := auth.Require(ctx, apinames.MemberPing); err != nil {
		return err
	}
	identity, _ := auth.FromContext(ctx)
	if identity.MemberID == "" {
		return auth.ErrUnauthenticated
	}
	fromID, err := dbutil.ParseUUID(identity.MemberID)
	if err != nil {
		return fmt.Errorf("invalid acting member id: %w", err)
	}
	receiver, err := s.queries.GetMemberByStudentID(
		ctx,
		pgtype.Text{String: studentID, Valid: true},
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("get receiver: %w", err)
	}
	if receiver.ID == fromID {
		return fmt.Errorf("%w: you can't ping yourself", ErrInvalidInput)
	}

	previous, err := s.queries.FindPingBetween(ctx, db.FindPingBetweenParams{
		MemberA: fromID,
		MemberB: receiver.ID,
	})
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		err = s.queries.CreatePing(ctx, db.CreatePingParams{
			FromMember: fromID,
			ToMember:   receiver.ID,
		})
	case err == nil:
		err = s.queries.RecordPing(ctx, db.RecordPingParams{
			ID:               previous.ID,
			SentByFromMember: previous.FromMember == fromID,
		})
	}
	if err != nil {
		return fmt.Errorf("record ping: %w", err)
	}

	return s.notifier.NotifyPing(ctx, integrations.PingNotification{
		FromMemberID:  identity.MemberID,
		FromStudentID: identity.StudentID,
		ToMemberID:    dbutil.UUIDStr(receiver.ID),
	})
}
