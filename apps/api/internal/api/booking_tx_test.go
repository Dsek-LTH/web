package api

import (
	"net/http"
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
)

// TestBookingWritesAreAtomic checks a booking request write that fails
// validation leaves nothing behind: no orphaned request on create, and an
// edit or acceptance changes neither the request nor its door access.
func TestBookingWritesAreAtomic(t *testing.T) {
	e := requireDB(t)
	admin := e.admin()
	booker := e.as(1, apinames.BookingRequestCreate)
	const unknownID = "00000000-0000-0000-0000-000000000001"

	e.mustCall(t, admin, http.MethodPost, "/bookables",
		map[string]any{"nameSv": "Tx room", "isDisabled": false})
	bookableID := e.one(t, `SELECT id::text FROM bookables WHERE name_sv = 'Tx room'`)
	door := e.one(t, `SELECT name FROM doors ORDER BY name LIMIT 1`)

	start := time.Now().Add(20 * 24 * time.Hour).Truncate(time.Hour)
	request := func(event string, bookables, doors, members []string) map[string]any {
		if doors == nil {
			doors = []string{}
		}
		if members == nil {
			members = []string{}
		}
		return map[string]any{
			"event":           event,
			"start":           start,
			"end":             start.Add(2 * time.Hour),
			"bookableIds":     bookables,
			"accessDoors":     doors,
			"accessMemberIds": members,
		}
	}
	count := func(query string, args ...any) string {
		t.Helper()
		return e.one(t, query, args...)
	}
	expect := func(res response, status int) {
		t.Helper()
		if res.status != status {
			t.Fatalf("got %d, want %d: %s", res.status, status, truncate(res.body))
		}
	}

	member := e.members[1].ID
	expect(e.call(t, booker, http.MethodPost, "/booking-requests",
		request("Tx booking", []string{bookableID}, []string{"no such door"}, nil)),
		http.StatusUnprocessableEntity)
	expect(e.call(t, booker, http.MethodPost, "/booking-requests",
		request("Tx booking", []string{unknownID}, nil, nil)),
		http.StatusUnprocessableEntity)
	expect(e.call(t, booker, http.MethodPost, "/booking-requests",
		request("Tx booking", []string{bookableID}, nil, []string{unknownID})),
		http.StatusUnprocessableEntity)
	if n := count(
		`SELECT count(*)::text FROM booking_requests WHERE event = 'Tx booking'`,
	); n != "0" {
		t.Fatalf("failed creates left %s booking requests behind", n)
	}

	e.mustCall(t, booker, http.MethodPost, "/booking-requests",
		request("Tx booking", []string{bookableID}, []string{door}, []string{member}))
	id := count(`SELECT id::text FROM booking_requests WHERE event = 'Tx booking'`)
	path := "/booking-requests/" + id
	e.mustCall(t, admin, http.MethodPost, path+"/accept", nil)
	policies := `SELECT count(*)::text FROM door_access_policies WHERE booking_request_id = $1`
	granted := count(policies, id)
	if granted == "0" {
		t.Fatal("accepting granted no door access")
	}

	// An admin edit naming an unknown member changes nothing.
	expect(e.call(t, admin, http.MethodPut, path,
		request("Tx edited", []string{bookableID}, []string{door}, []string{unknownID})),
		http.StatusUnprocessableEntity)
	state := `SELECT event || ' ' || status FROM booking_requests WHERE id = $1`
	if got := count(state, id); got != "Tx booking ACCEPTED" {
		t.Fatalf("failed edit changed the request to %q", got)
	}
	if got := count(policies, id); got != granted {
		t.Fatalf("failed edit changed door access from %s to %s policies", granted, got)
	}

	// Accepting with an unknown door changes nothing either.
	e.mustCall(t, admin, http.MethodPost, path+"/reject", nil)
	expect(e.call(t, admin, http.MethodPost, path+"/accept",
		map[string]any{"accessDoors": []string{"no such door"}, "accessMemberIds": []string{}}),
		http.StatusUnprocessableEntity)
	if got := count(state, id); got != "Tx booking DENIED" {
		t.Fatalf("failed accept changed the request to %q", got)
	}
	if got := count(`SELECT count(*)::text FROM _booking_requests_access_doors WHERE "A" = $1`,
		id); got != "1" {
		t.Fatalf("failed accept changed the requested doors to %s", got)
	}
}
