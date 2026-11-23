package nollning

import (
	"context"
	"os"
	"testing"

	"github.com/joho/godotenv"

	"github.com/dsek-lth/web/apps/api/internal/db"
)

// Runs against the dev database (POSTGRES_URL, falling back to the repo's
// .env) inside a rolled-back transaction; skipped without one.
func TestCurrentIsLookedUpOncePerRequest(t *testing.T) {
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
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Skipf("database unreachable: %v", err)
	}
	t.Cleanup(func() { _ = tx.Rollback(context.Background()) })
	svc := NewService(tx)

	ctx = WithRequestCache(ctx)
	before, err := svc.Current(ctx)
	if err != nil {
		t.Fatal(err)
	}
	// A season starting now is the newest covering now, so it becomes
	// current - but not within this request until it's forgotten.
	var id string
	if err := tx.QueryRow(ctx, `
		INSERT INTO nollning_seasons (year, nolla_start_at, reveal_at, end_at)
		VALUES (1901, now(), now(), now() + interval '1 day')
		RETURNING id::text`).Scan(&id); err != nil {
		t.Fatal(err)
	}
	cached, err := svc.Current(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if (cached == nil) != (before == nil) || (cached != nil && cached.ID != before.ID) {
		t.Errorf("Current changed within the request without a season write")
	}
	forgetCurrent(ctx)
	after, err := svc.Current(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if after == nil || after.ID != id {
		t.Errorf("after forgetting, Current = %v, want the new season %s", after, id)
	}
}
