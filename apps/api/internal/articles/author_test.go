package articles

import (
	"context"
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/sanitize"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
)

// An editor who isn't the author keeps the article's byline; before, the
// editor became the author and the author lost the right to edit it.
func TestEditingSomeoneElsesArticleKeepsTheAuthor(t *testing.T) {
	h := newHarness(t)
	h.svc.sanitizer = sanitize.UGC()
	ctx := context.Background()

	var authorMemberID, editorID pgtype.UUID
	if err := h.tx.QueryRow(
		ctx,
		"SELECT member_id FROM authors WHERE id = $1",
		h.authorID,
	).Scan(&authorMemberID); err != nil {
		t.Fatal(err)
	}
	if err := h.tx.QueryRow(
		ctx,
		"SELECT id FROM members WHERE id <> $1 LIMIT 1",
		authorMemberID,
	).Scan(&editorID); err != nil {
		t.Skipf("no second member: %v", err)
	}

	id := h.article(time.Now().Add(-time.Hour), false)
	var slug string
	if err := h.tx.QueryRow(ctx, "SELECT slug FROM articles WHERE id = $1", id).
		Scan(&slug); err != nil {
		t.Fatal(err)
	}

	editorCtx := auth.ContextWithIdentity(ctx, &auth.Identity{
		MemberID: dbutil.UUIDStr(editorID),
		Policies: []string{apinames.NewsArticleUpdate},
	})
	published := time.Now().Add(-time.Hour)
	if _, err := h.svc.Update(editorCtx, slug, ArticleInput{
		HeaderSv:    "Edited",
		BodySv:      "Body",
		PublishedAt: &published,
	}); err != nil {
		t.Fatal(err)
	}

	var authorID pgtype.UUID
	if err := h.tx.QueryRow(ctx,
		"SELECT author_id FROM articles WHERE id = $1", id).Scan(&authorID); err != nil {
		t.Fatal(err)
	}
	if authorID != h.authorID {
		t.Errorf(
			"author changed to %s, want %s",
			dbutil.UUIDStr(authorID),
			dbutil.UUIDStr(h.authorID),
		)
	}
}
