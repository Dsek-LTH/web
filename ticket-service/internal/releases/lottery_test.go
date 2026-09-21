package releases

import (
	"math/rand"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/Dsek-LTH/ticket-service/internal/db"
)

func makeEntries(n int) []db.TicketQueueEntry {
	entries := make([]db.TicketQueueEntry, n)
	for i := range entries {
		var id pgtype.UUID
		id.Bytes[0] = byte(i)
		id.Valid = true
		entries[i] = db.TicketQueueEntry{ID: id, MemberID: string(rune('a' + i))}
	}
	return entries
}

func TestRunLottery_FewerPendingThanQuantity(t *testing.T) {
	pending := makeEntries(3)
	granted, waitlisted := runLottery(rand.New(rand.NewSource(1)), pending, 5)

	if len(granted) != 3 {
		t.Fatalf("expected all 3 pending entries granted, got %d", len(granted))
	}
	if len(waitlisted) != 0 {
		t.Fatalf("expected empty waitlist, got %d", len(waitlisted))
	}
}

func TestRunLottery_MorePendingThanQuantity(t *testing.T) {
	pending := makeEntries(10)
	granted, waitlisted := runLottery(rand.New(rand.NewSource(1)), pending, 4)

	if len(granted) != 4 {
		t.Fatalf("expected 4 granted, got %d", len(granted))
	}
	if len(waitlisted) != 6 {
		t.Fatalf("expected 6 waitlisted, got %d", len(waitlisted))
	}

	seen := map[string]bool{}
	for _, e := range granted {
		seen[e.MemberID] = true
	}
	for _, e := range waitlisted {
		if seen[e.MemberID] {
			t.Fatalf("member %s appears in both granted and waitlisted", e.MemberID)
		}
		seen[e.MemberID] = true
	}
	if len(seen) != 10 {
		t.Fatalf("expected all 10 original entries accounted for, got %d", len(seen))
	}
}

func TestRunLottery_ZeroPending(t *testing.T) {
	granted, waitlisted := runLottery(rand.New(rand.NewSource(1)), nil, 5)
	if len(granted) != 0 || len(waitlisted) != 0 {
		t.Fatalf("expected no entries either way, got granted=%d waitlisted=%d", len(granted), len(waitlisted))
	}
}

func TestRunLottery_NotAlwaysFirstComeFirstServed(t *testing.T) {
	// With enough entries and quantity < len(pending), repeated runs across
	// different seeds should not always grant the same prefix of the input
	// order - that would indicate the "lottery" is secretly just FIFO.
	pending := makeEntries(20)
	firstEntrySometimesWaitlisted := false
	for seed := int64(0); seed < 50; seed++ {
		granted, _ := runLottery(rand.New(rand.NewSource(seed)), pending, 10)
		grantedFirst := false
		for _, e := range granted {
			if e.MemberID == pending[0].MemberID {
				grantedFirst = true
				break
			}
		}
		if !grantedFirst {
			firstEntrySometimesWaitlisted = true
			break
		}
	}
	if !firstEntrySometimesWaitlisted {
		t.Fatal("expected the first-requested entry to sometimes miss out on a grant across random seeds")
	}
}
