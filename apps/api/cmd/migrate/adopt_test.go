package main

import (
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestCheckPrismaHistory(t *testing.T) {
	now := time.Now()
	done := func(name string) prismaRow { return prismaRow{name: name, finishedAt: &now} }
	complete := func() []prismaRow {
		var rows []prismaRow
		for _, name := range prismaMigrations {
			rows = append(rows, done(name))
		}
		return rows
	}

	if err := checkPrismaHistory(complete()); err != nil {
		t.Errorf("complete history: %v", err)
	}

	// A failed attempt that was rolled back and then retried is fine.
	retried := append(complete(), prismaRow{name: prismaMigrations[3], rolledBackAt: &now})
	if err := checkPrismaHistory(retried); err != nil {
		t.Errorf("rolled-back attempt: %v", err)
	}

	// Prisma migrations main gained after the squash, which Go migrations
	// after the baseline redo: all, some or none of them may be there.
	withPorted := complete()
	for name := range portedPrismaMigrations {
		withPorted = append(withPorted, done(name))
	}
	if err := checkPrismaHistory(withPorted); err != nil {
		t.Errorf("with the ported migrations: %v", err)
	}
	if err := checkPrismaHistory(
		append(complete(), done("20261109170634_add_long_position_descriptions")),
	); err != nil {
		t.Errorf("with one ported migration: %v", err)
	}

	for _, tc := range []struct {
		name    string
		history []prismaRow
		want    string
	}{
		{"missing one", complete()[1:], "not applied: " + prismaMigrations[0]},
		{
			"one more than the baseline",
			append(complete(), done("20261201000000_upstream_change")),
			"20261201000000_upstream_change",
		},
		{
			"unfinished",
			append(complete(), prismaRow{name: "20261201000000_half_done"}),
			"failed or never finished",
		},
		{"empty", nil, "not applied"},
	} {
		err := checkPrismaHistory(tc.history)
		if err == nil || !strings.Contains(err.Error(), tc.want) {
			t.Errorf("%s: got %v, want an error containing %q", tc.name, err, tc.want)
		}
	}
}

func TestPrismaMigrationsEndAtBaseline(t *testing.T) {
	last := prismaMigrations[len(prismaMigrations)-1]
	if !strings.HasPrefix(last, "20261103200000_") {
		t.Errorf("last Prisma migration %s isn't the baseline's version %d", last, baselineVersion)
	}
}

// Every ported Prisma migration names a Go migration that exists.
func TestPortedPrismaMigrationsExist(t *testing.T) {
	for prisma, goName := range portedPrismaMigrations {
		matches, err := filepath.Glob(filepath.Join("..", "..", migrationsDir, goName+".up.sql"))
		if err != nil || len(matches) != 1 {
			t.Errorf("%s: Go migration %s not found (%v)", prisma, goName, err)
		}
	}
}
