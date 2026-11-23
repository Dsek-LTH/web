package api

import (
	"context"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/nollning"
)

// TestPhadderRoleOnlyCountsTheCurrentSeason checks that a nolla group or
// phadder mandate from an earlier season isn't reported as the member's
// role now, and that the newest phadder mandate in the season wins. It runs
// in a rolled-back transaction on the test database.
func TestPhadderRoleOnlyCountsTheCurrentSeason(t *testing.T) {
	e := requireDB(t)
	ctx := context.Background()
	tx, err := e.pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	svc := nollning.NewService(tx)

	year, err := svc.NollaYear(ctx)
	if err != nil {
		t.Fatal(err)
	}
	one := func(query string, args ...any) string {
		t.Helper()
		var v string
		if err := tx.QueryRow(ctx, query, args...).Scan(&v); err != nil {
			t.Fatalf("%s: %v", query, err)
		}
		return v
	}
	exec := func(query string, args ...any) {
		t.Helper()
		if _, err := tx.Exec(ctx, query, args...); err != nil {
			t.Fatalf("%s: %v", query, err)
		}
	}
	season := func(y int) string {
		exec(`INSERT INTO nollning_seasons (year, nolla_start_at, reveal_at, end_at)
			VALUES ($1, make_date($1, 8, 18), make_date($1, 8, 25), make_date($1, 10, 1))
			ON CONFLICT (year) DO NOTHING`, y)
		return one(`SELECT id::text FROM nollning_seasons WHERE year = $1`, y)
	}
	group := func(seasonID, name string) string {
		return one(`INSERT INTO phadder_groups (name, season_id) VALUES ($1, $2)
			RETURNING id::text`, name, seasonID)
	}
	current, previous := season(year), season(year-1)
	currentGroup := group(current, "Current group")
	otherCurrentGroup := group(current, "Other current group")
	previousGroup := group(previous, "Previous group")
	exec(`INSERT INTO positions (id, name_sv) VALUES ('dsek.noll.phadder', 'Phadder')
		ON CONFLICT (id) DO NOTHING`)

	nolla, phadder := e.members[4], e.members[5]
	exec(`UPDATE members SET nollning_group_id = NULL WHERE id = ANY($1)`,
		[]string{nolla.ID, phadder.ID})
	exec(`DELETE FROM mandates WHERE member_id = ANY($1)
		AND position_id IN ('dsek.noll.phadder', 'dsek.noll.uppdrag')`,
		[]string{nolla.ID, phadder.ID})

	expect := func(m seededMember, wantRole nollning.PhadderRole, wantGroup string) {
		t.Helper()
		role, groupID, err := svc.PhadderRoleFor(ctx, m.StudentID)
		if err != nil {
			t.Fatal(err)
		}
		got := ""
		if groupID != nil {
			got = *groupID
		}
		if role != wantRole || got != wantGroup {
			t.Errorf("%s: got (%s, %q), want (%s, %q)", m.StudentID, role, got, wantRole, wantGroup)
		}
	}
	mandate := func(groupID string, start, end string) {
		exec(`INSERT INTO mandates (member_id, position_id, start_date, end_date,
				"phadderInId", last_synced)
			VALUES ($1, 'dsek.noll.phadder', $2::date, $3::date, $4, now())`,
			phadder.ID, start, end, groupID)
	}
	date := func(y int, md string) string { return fmt.Sprintf("%d%s", y, md) }

	// Last season's nolla isn't a nolla now.
	exec(`UPDATE members SET nollning_group_id = $2 WHERE id = $1`, nolla.ID, previousGroup)
	expect(nolla, nollning.PhadderRoleNone, "")
	exec(`UPDATE members SET nollning_group_id = $2 WHERE id = $1`, nolla.ID, currentGroup)
	expect(nolla, nollning.PhadderRoleNolla, currentGroup)

	// Last season's phadder isn't a phadder now.
	mandate(previousGroup, date(year-1, "-01-01"), date(year-1, "-12-31"))
	expect(phadder, nollning.PhadderRoleNone, "")
	// Of two mandates in this season, the newest one's group.
	mandate(currentGroup, date(year, "-01-01"), date(year, "-12-31"))
	mandate(otherCurrentGroup, date(year, "-08-01"), date(year, "-12-31"))
	expect(phadder, nollning.PhadderRolePhadder, otherCurrentGroup)
}

// TestProfileShowsAPastNollaGroup checks that a member's profile keeps the
// group they were a nolla in after its season, for any signed-in viewer
// (the phadder role above only covers the current season).
func TestProfileShowsAPastNollaGroup(t *testing.T) {
	e := requireDB(t)
	ctx := context.Background()
	year := time.Now().Year() - 20
	seasonID := e.one(t, `INSERT INTO nollning_seasons (year, nolla_start_at, reveal_at, end_at)
		VALUES ($1, make_date($1, 8, 18), make_date($1, 8, 25), make_date($1, 10, 1))
		RETURNING id::text`, year)
	groupID := e.one(t, `INSERT INTO phadder_groups (name, season_id)
		VALUES ('Old nolla group', $1) RETURNING id::text`, seasonID)
	nolla := e.members[3]
	if _, err := e.pool.Exec(ctx, `UPDATE members SET nollning_group_id = $2 WHERE id = $1`,
		nolla.ID, groupID); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, _ = e.pool.Exec(
			ctx,
			`UPDATE members SET nollning_group_id = NULL WHERE id = $1`,
			nolla.ID,
		)
		_, _ = e.pool.Exec(ctx, `DELETE FROM phadder_groups WHERE id = $1`, groupID)
		_, _ = e.pool.Exec(ctx, `DELETE FROM nollning_seasons WHERE id = $1`, seasonID)
	})

	path := "/members/" + nolla.StudentID
	e.check(t, []accessCase{{anonymous, http.MethodGet, path, nil, denied}})
	for _, c := range []caller{e.as(1), e.as(3)} {
		var profile struct {
			NollaIn *struct {
				ID   string `json:"id"`
				Name string `json:"name"`
				Year int    `json:"year"`
			} `json:"nollaIn"`
		}
		e.mustCall(t, c, http.MethodGet, path, nil).decode(t, &profile)
		if profile.NollaIn == nil || profile.NollaIn.ID != groupID ||
			profile.NollaIn.Name != "Old nolla group" || profile.NollaIn.Year != year {
			t.Errorf("GET %s as %s: nollaIn %+v, want group %s of %d",
				path, c.label, profile.NollaIn, groupID, year)
		}
	}

	var other map[string]any
	e.mustCall(t, e.as(3), http.MethodGet, "/members/"+e.members[1].StudentID, nil).
		decode(t, &other)
	if _, has := other["nollaIn"]; has {
		t.Errorf("nollaIn on a member who was never a nolla: %v", other["nollaIn"])
	}
}
