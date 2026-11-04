package main

import (
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
