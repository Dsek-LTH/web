package notifications

import (
	"context"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/joho/godotenv"

	"github.com/dsek-lth/web/apps/api/internal/db"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
)

// Runs against the dev database (POSTGRES_URL, falling back to the repo's
// .env) inside a rolled-back transaction; skipped without a database.
func TestSendAsAuthorSkipsTheAuthorsMember(t *testing.T) {
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

	var authorID, authorMember, other pgtype.UUID
	if err := tx.QueryRow(ctx, "SELECT id, member_id FROM authors LIMIT 1").
		Scan(&authorID, &authorMember); err != nil {
		t.Skipf("no author: %v", err)
	}
	if err := tx.QueryRow(ctx, "SELECT id FROM members WHERE id != $1 LIMIT 1", authorMember).
		Scan(&other); err != nil {
		t.Skipf("no second member: %v", err)
	}
	for _, m := range []pgtype.UUID{authorMember, other} {
		if _, err := tx.Exec(ctx, `
			INSERT INTO subscription_settings (member_id, type) VALUES ($1, $2)
			ON CONFLICT (member_id, type) DO NOTHING`, m, string(SettingNewArticle)); err != nil {
			t.Fatal(err)
		}
	}

	svc := &Service{queries: db.New(tx), pushMock: true}
	link := "/news/self-notify-test"
	author := dbutil.UUIDStr(authorID)
	if err := svc.Send(ctx, SendParams{
		Title:        "Test",
		Message:      "Test",
		Type:         TypeNewArticle,
		Link:         link,
		MemberIDs:    []string{dbutil.UUIDStr(authorMember), dbutil.UUIDStr(other)},
		FromAuthorID: &author,
	}); err != nil {
		t.Fatal(err)
	}

	count := func(m pgtype.UUID) int {
		var n int
		if err := tx.QueryRow(ctx,
			"SELECT count(*) FROM notifications WHERE member_id = $1 AND link = $2",
			m, link).Scan(&n); err != nil {
			t.Fatal(err)
		}
		return n
	}
	if n := count(authorMember); n != 0 {
		t.Errorf("author got %d notifications about their own article, want 0", n)
	}
	if n := count(other); n != 1 {
		t.Errorf("other member got %d notifications, want 1", n)
	}
}
