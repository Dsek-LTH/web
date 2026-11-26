package articles

import (
	"context"
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/dbutil"
)

func TestNollningArticlesStayOutOfTheFeed(t *testing.T) {
	h := newHarness(t)
	ctx := context.Background()
	var seasonID string
	err := h.tx.QueryRow(ctx, `
		INSERT INTO nollning_seasons (year, nolla_start_at, reveal_at, end_at)
		VALUES (1900, now(), now(), now())
		RETURNING id::text`).Scan(&seasonID)
	if err != nil {
		t.Fatal(err)
	}
	// Newer than anything else, so it would be first in the feed.
	id := h.article(time.Now().Add(-time.Second), false)
	if _, err := h.tx.Exec(ctx,
		"UPDATE articles SET nollning_season_id = $1 WHERE id = $2", seasonID, id); err != nil {
		t.Fatal(err)
	}

	listed := func(params ListParams) bool {
		t.Helper()
		params.PageSize = 100
		items, _, err := h.svc.List(ctx, params)
		if err != nil {
			t.Fatal(err)
		}
		for _, a := range items {
			if a.ID == dbutil.UUIDStr(id) {
				return true
			}
		}
		return false
	}
	if listed(ListParams{}) {
		t.Error("the general feed lists a nollning article")
	}
	if !listed(ListParams{IncludeNollning: true}) {
		t.Error("includeNollning doesn't list it")
	}
	if !listed(ListParams{NollningSeasonID: &seasonID}) {
		t.Error("its season's feed doesn't list it")
	}
}
