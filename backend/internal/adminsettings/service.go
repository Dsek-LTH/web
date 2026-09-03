// Package adminsettings is the generic operator key/value store behind
// admin/settings - see DESIGN.md's roadmap Phase 11 ("Admin
// consolidation"). Ported from src/routes/(app)/admin/settings/
// +page.server.ts's update/remove actions. The admin_settings table
// pre-dates this Go port (already read by internal/nollning's predecessor
// and internal/notifications' Discord webhook config) - this package is
// the first to actually write it from Go.
package adminsettings

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
)

var (
	ErrNotFound     = errors.New("adminsettings: not found")
	ErrInvalidInput = errors.New("adminsettings: invalid input")
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

func toSetting(row db.AdminSetting) Setting {
	return Setting{
		Key:       row.Key,
		Value:     row.Value.String,
		CreatedAt: row.CreatedAt.Time,
		UpdatedAt: row.UpdatedAt.Time,
	}
}

// List requires AdminSettingsRead - matches the old load()'s
// authorize(apiNames.ADMIN.SETTINGS.READ, user) exactly.
func (s *Service) List(ctx context.Context) ([]Setting, error) {
	if err := auth.Require(ctx, apinames.AdminSettingsRead); err != nil {
		return nil, err
	}
	rows, err := s.queries.ListAdminSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("list admin settings: %w", err)
	}
	out := make([]Setting, len(rows))
	for i, row := range rows {
		out[i] = toSetting(row)
	}
	return out, nil
}

// Upsert creates or updates one setting - gated on AdminSettingsUpdate, a
// real explicit check the old "update" action never had at all (it relied
// on the route only being linked from an admin page, not an actual
// server-side authorize() call).
func (s *Service) Upsert(ctx context.Context, key, value string) (*Setting, error) {
	if err := auth.Require(ctx, apinames.AdminSettingsUpdate); err != nil {
		return nil, err
	}
	if key == "" {
		return nil, invalidf("key is required")
	}
	row, err := s.queries.UpsertAdminSetting(ctx, db.UpsertAdminSettingParams{
		Key:   key,
		Value: pgtype.Text{String: value, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("upsert admin setting: %w", err)
	}
	out := toSetting(row)
	return &out, nil
}

// Delete removes one setting - gated on AdminSettingsDelete, same "real
// explicit check the old action never had" situation as Upsert.
func (s *Service) Delete(ctx context.Context, key string) error {
	if err := auth.Require(ctx, apinames.AdminSettingsDelete); err != nil {
		return err
	}
	n, err := s.queries.DeleteAdminSetting(ctx, key)
	if err != nil {
		return fmt.Errorf("delete admin setting: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
