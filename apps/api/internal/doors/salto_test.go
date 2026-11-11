package doors

import (
	"context"
	"os"
	"slices"
	"testing"

	"github.com/joho/godotenv"

	"github.com/dsek-lth/web/apps/api/internal/db"
)

// TestSaltoRolePrefixMatching runs against the dev database (POSTGRES_URL,
// falling back to the repo's .env) inside a rolled-back transaction, and
// skips without one. It pins how a door policy's role is matched against
// position ids: literally as a prefix (a "_" in the role is not a LIKE
// wildcard), except the virtual role "_", which has always matched every
// position (the old app sent it to Postgres unescaped as '_%').
func TestSaltoRolePrefixMatching(t *testing.T) {
	_ = godotenv.Load("../../.env")
	dsn := os.Getenv("POSTGRES_URL")
	if dsn == "" {
		t.Skip("POSTGRES_URL not set")
	}
	ctx := context.Background()
	pool, err := db.NewPool(ctx, dsn)
	if err != nil {
		t.Skipf("database unreachable: %v", err)
	}
	t.Cleanup(pool.Close)
	if err := pool.Ping(ctx); err != nil {
		t.Skipf("database unreachable: %v", err)
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = tx.Rollback(context.Background()) })

	exec := func(sql string, args ...any) {
		t.Helper()
		if _, err := tx.Exec(ctx, sql, args...); err != nil {
			t.Fatalf("%s: %v", sql, err)
		}
	}
	// t35.a_b holds a literal "_"; t35.aXb only matches "t35.a_b%" if the
	// "_" is treated as a wildcard.
	for pos, sid := range map[string]string{
		"t35.a_b": "t35lit", "t35.aXb": "t35wild", "t35.other": "t35other",
	} {
		exec(`INSERT INTO positions (id, name_sv) VALUES ($1, $1)`, pos)
		exec(`INSERT INTO members (student_id) VALUES ($1)`, sid)
		exec(`INSERT INTO mandates (member_id, position_id, start_date, end_date, last_synced)
			SELECT id, $2, current_date - 1, current_date + 1, current_date
			FROM members WHERE student_id = $1`, sid, pos)
	}
	for door, role := range map[string]string{"t35-literal": "t35.a_b", "t35-any": "_"} {
		exec(`INSERT INTO doors (name, verbose_name) VALUES ($1, $1)`, door)
		exec(`INSERT INTO door_access_policies (door_name, role) VALUES ($1, $2)`, door, role)
	}

	svc := NewService(tx)
	allowed := func(door string) []string {
		t.Helper()
		ids, err := svc.resolveAllowedStudentIDs(ctx, door)
		if err != nil {
			t.Fatal(err)
		}
		return ids
	}

	if got := allowed("t35-literal"); !slices.Equal(got, []string{"t35lit"}) {
		t.Errorf(`role "t35.a_b" allowed %v, want only [t35lit] ("_" must match literally)`, got)
	}
	got := allowed("t35-any")
	for _, sid := range []string{"t35lit", "t35wild", "t35other"} {
		if !slices.Contains(got, sid) {
			t.Errorf(
				`role "_" allowed %v, want every current mandate holder (missing %s)`,
				got,
				sid,
			)
		}
	}
}
