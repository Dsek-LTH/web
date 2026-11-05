package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/golang-migrate/migrate/v4"

	"github.com/dsek-lth/web/apps/api/internal/db"
)

// baselineVersion is 20261103200000_baseline: the schema Prisma's migrations
// had built by then.
const baselineVersion = 20261103200000

// adoptPrismaDatabase lets `migrate up` take over a database Prisma
// migrated (production and staging before the switch): it has the
// baseline's tables but no schema_migrations version, so running the
// baseline would fail on tables that already exist. If its
// _prisma_migrations shows exactly the migrations the baseline replaced,
// the baseline is recorded as applied and `up` continues from there. A
// database with no version and no _prisma_migrations is fresh and gets
// everything. A tracked database is left alone, unless its version is from
// before the squash.
func adoptPrismaDatabase(ctx context.Context, m *migrate.Migrate, dsn string) error {
	version, _, err := m.Version()
	if err == nil {
		return checkKnownVersion(version)
	}
	if !errors.Is(err, migrate.ErrNilVersion) {
		return fmt.Errorf("read version: %w", err)
	}

	pool, err := db.NewPool(ctx, dsn)
	if err != nil {
		return fmt.Errorf("connect: %w", err)
	}
	defer pool.Close()

	var hasPrisma bool
	if err := pool.QueryRow(
		ctx, `SELECT to_regclass('public._prisma_migrations') IS NOT NULL`,
	).Scan(&hasPrisma); err != nil {
		return fmt.Errorf("look for _prisma_migrations: %w", err)
	}
	if !hasPrisma {
		return nil
	}

	rows, err := pool.Query(
		ctx, `SELECT migration_name, finished_at, rolled_back_at FROM public._prisma_migrations`,
	)
	if err != nil {
		return fmt.Errorf("read _prisma_migrations: %w", err)
	}
	var history []prismaRow
	for rows.Next() {
		var r prismaRow
		if err := rows.Scan(&r.name, &r.finishedAt, &r.rolledBackAt); err != nil {
			return fmt.Errorf("read _prisma_migrations: %w", err)
		}
		history = append(history, r)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("read _prisma_migrations: %w", err)
	}
	if err := checkPrismaHistory(history); err != nil {
		return fmt.Errorf("refusing to adopt this Prisma-migrated database: %w", err)
	}

	log.Printf(
		"adopting a Prisma-migrated database: recording %d (baseline) as applied",
		baselineVersion,
	)
	return m.Force(baselineVersion)
}

type prismaRow struct {
	name         string
	finishedAt   *time.Time
	rolledBackAt *time.Time
}

// checkPrismaHistory reports whether the applied Prisma migrations are
// exactly prismaMigrations. A rolled-back attempt doesn't count; an
// unfinished one (failed, or still running) blocks adoption.
func checkPrismaHistory(history []prismaRow) error {
	applied := map[string]bool{}
	for _, r := range history {
		switch {
		case r.rolledBackAt != nil:
		case r.finishedAt == nil:
			return fmt.Errorf("Prisma migration %s failed or never finished", r.name)
		default:
			applied[r.name] = true
		}
	}
	var missing, extra []string
	for _, name := range prismaMigrations {
		if !applied[name] {
			missing = append(missing, name)
		}
		delete(applied, name)
	}
	for name := range applied {
		extra = append(extra, name)
	}
	slices.Sort(extra)
	var problems []string
	if len(missing) > 0 {
		problems = append(problems, "not applied: "+strings.Join(missing, ", "))
	}
	if len(extra) > 0 {
		problems = append(problems, "applied but not part of the baseline (port them to "+
			"internal/db/migrations first): "+strings.Join(extra, ", "))
	}
	if len(problems) > 0 {
		return errors.New(strings.Join(problems, "; "))
	}
	return nil
}

// checkKnownVersion catches a database migrated with the numbering from
// before the history was squashed, whose version has no file anymore.
func checkKnownVersion(version uint) error {
	matches, err := filepath.Glob(filepath.Join(migrationsDir, fmt.Sprintf("%d_*.up.sql", version)))
	if err != nil {
		return err
	}
	if len(matches) == 0 {
		return fmt.Errorf(
			"the database is at version %d, which isn't in %s - it was migrated before "+
				"the history was squashed into the baseline. If it's a local dev "+
				"database, recreate it: drop it, then `go tool migrate up` and `go tool seed`",
			version, migrationsDir,
		)
	}
	return nil
}
