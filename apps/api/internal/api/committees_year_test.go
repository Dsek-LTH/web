package api

import (
	"context"
	"net/http"
	"testing"
)

// A committee's counts are for the requested year (T38), like the old page.
func TestCommitteeCountsFollowTheYear(t *testing.T) {
	e := requireDB(t)
	ctx := context.Background()
	exec := func(query string, args ...any) {
		t.Helper()
		if _, err := e.pool.Exec(ctx, query, args...); err != nil {
			t.Fatalf("%s: %v", query, err)
		}
	}
	exec(`INSERT INTO committees (name_sv, short_name) VALUES ('T38', 't38')`)
	exec(`INSERT INTO positions (id, name_sv, committee_id)
		SELECT 'dsek.t38.a', 'A', id FROM committees WHERE short_name = 't38'`)
	// Two mandates in 2001 (the same member twice), one in 2002.
	m1, m2 := e.members[1].ID, e.members[2].ID
	exec(`INSERT INTO mandates (member_id, position_id, start_date, end_date, last_synced) VALUES
		($1, 'dsek.t38.a', '2001-01-01', '2001-06-30', now()),
		($1, 'dsek.t38.a', '2001-07-01', '2001-12-31', now()),
		($2, 'dsek.t38.a', '2002-01-01', '2002-12-31', now())`, m1, m2)

	for _, tc := range []struct {
		year              string
		mandates, members int64
	}{{"2001", 2, 1}, {"2002", 1, 1}, {"2003", 0, 0}} {
		var got struct {
			MandateCount int64 `json:"mandateCount"`
			MemberCount  int64 `json:"memberCount"`
		}
		e.mustCall(t, e.as(1), http.MethodGet, "/committees/t38?year="+tc.year, nil).decode(t, &got)
		if got.MandateCount != tc.mandates || got.MemberCount != tc.members {
			t.Errorf("%s: got %d mandates, %d members; want %d, %d",
				tc.year, got.MandateCount, got.MemberCount, tc.mandates, tc.members)
		}
	}
}
