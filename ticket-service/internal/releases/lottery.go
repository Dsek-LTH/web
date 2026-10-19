package releases

import (
	"math/rand"

	"github.com/Dsek-LTH/ticket-service/internal/db"
)

// runLottery splits pending entries into those granted a ticket and those
// placed on the waitlist. Everyone who requested during the grace window has
// equal odds regardless of how quickly they requested - order is randomized
// rather than first-come-first-served. The order of the returned waitlist
// slice becomes each entry's queue_position (0 = front of the line).
func runLottery(rng *rand.Rand, pending []db.TicketQueueEntry, quantity int) (granted, waitlisted []db.TicketQueueEntry) {
	shuffled := make([]db.TicketQueueEntry, len(pending))
	copy(shuffled, pending)
	rng.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})

	cut := quantity
	if cut > len(shuffled) {
		cut = len(shuffled)
	}
	if cut < 0 {
		cut = 0
	}

	return shuffled[:cut], shuffled[cut:]
}
