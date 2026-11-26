package api

import (
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"
)

// The checks the old app's forms made, now in Go (T36). Each request is
// made by someone allowed to make it, so the status is the validation's.
func TestInputValidation(t *testing.T) {
	e := requireDB(t)
	admin := e.admin()
	long := strings.Repeat("å", 256)
	with := func(body map[string]any, key string, value any) map[string]any {
		copied := map[string]any{}
		for k, v := range body {
			copied[k] = v
		}
		copied[key] = value
		return copied
	}
	expect := func(name, method, path string, body any, want int) {
		t.Helper()
		if got := e.call(t, admin, method, path, body); got.status != want {
			t.Errorf("%s: got %d, want %d: %s", name, got.status, want, got.body)
		}
	}

	article := articleBody("T36 article", nil)
	expect(
		"article without header",
		http.MethodPost,
		"/articles",
		with(article, "headerSv", " "),
		422,
	)
	expect(
		"article with a long header",
		http.MethodPost,
		"/articles",
		with(article, "headerSv", long),
		422,
	)
	expect(
		"article with a long English header",
		http.MethodPost,
		"/articles",
		with(article, "headerEn", long),
		422,
	)
	expect("article with long notification text", http.MethodPost, "/articles",
		with(article, "notificationText", long), 422)
	expect("article with a non-YouTube link", http.MethodPost, "/articles",
		with(article, "youtubeUrl", "https://vimeo.com/1"), 422)
	expect("article with a YouTube link", http.MethodPost, "/articles",
		with(article, "youtubeUrl", "https://youtu.be/dQw4w9WgXcQ"), 201)
	expect("article with a 255-character header", http.MethodPost, "/articles",
		with(article, "headerSv", strings.Repeat("å", 255)), 201)

	event := eventBody("T36 event")
	start := event["startAt"].(time.Time)
	expect("event without title", http.MethodPost, "/events", with(event, "titleSv", ""), 422)
	expect(
		"event with a long location",
		http.MethodPost,
		"/events",
		with(event, "location", long),
		422,
	)
	expect(
		"event ending when it starts",
		http.MethodPost,
		"/events",
		with(event, "endAt", start),
		422,
	)
	expect("event ending before it starts", http.MethodPost, "/events",
		with(event, "endAt", start.Add(-time.Hour)), 422)
	expect("event series ending before it starts", http.MethodPost, "/events",
		with(event, "recurring", map[string]any{
			"type": "WEEKLY", "separationCount": 0, "endAt": start.Add(-24 * time.Hour),
		}), 422)
	expect("event", http.MethodPost, "/events", event, 201)
	slug := e.one(t, `SELECT slug FROM events WHERE title_sv = 'T36 event'`)
	expect("event edited to end before it starts", http.MethodPut, "/events/"+slug,
		with(event, "endAt", start.Add(-time.Hour)), 422)

	expect("articles page of 501", http.MethodGet, "/articles?pageSize=501", nil, 422)
	expect("articles page of 500", http.MethodGet, "/articles?pageSize=500", nil, 200)
	expect("events page of 501", http.MethodGet, "/events?pageSize=501", nil, 422)

	position := e.one(t, `SELECT id FROM positions LIMIT 1`)
	mandates := func(memberIDs []string, start, end string) map[string]any {
		return map[string]any{"memberIds": memberIDs, "startDate": start, "endDate": end}
	}
	member := e.members[3].ID
	path := "/positions/" + position + "/mandates"
	expect("mandate ending when it starts", http.MethodPost, path,
		mandates([]string{member}, "2030-01-01", "2030-01-01"), 422)
	expect("mandate for an unknown position", http.MethodPost, "/positions/dsek.no.such/mandates",
		mandates([]string{member}, "2030-01-01", "2030-12-31"), 404)
	expect("mandates with an unknown member", http.MethodPost, path, mandates(
		[]string{member, "00000000-0000-0000-0000-000000000000"}, "2030-01-01", "2030-12-31",
	), 422)
	if n := e.one(t, `SELECT count(*)::text FROM mandates
		WHERE member_id = $1 AND start_date = '2030-01-01'`, member); n != "0" {
		t.Errorf("a failed mandate insert left %s mandates behind", n)
	}
	expect(
		"mandate",
		http.MethodPost,
		path,
		mandates([]string{member}, "2030-01-01", "2030-12-31"),
		201,
	)
	mandate := e.one(t, `SELECT id::text FROM mandates
		WHERE member_id = $1 AND start_date = '2030-01-01'`, member)
	expect("mandate edited to end before it starts", http.MethodPut, "/mandates/"+mandate,
		map[string]any{"startDate": "2030-12-31", "endDate": "2030-01-01"}, 422)
	expect("unknown mandate deleted", http.MethodDelete,
		"/mandates/00000000-0000-0000-0000-000000000000", nil, 404)

	upload := func(year int) form {
		return form{
			fields: map[string]string{
				"type": "meeting", "year": fmt.Sprint(year), "folder": "S01", "name": "t36",
			},
			files: map[string][]formFile{"file": {pngFile}},
		}
	}
	expect(
		"document from before the guild",
		http.MethodPost,
		"/meeting-documents",
		upload(1961),
		422,
	)
	expect("document two years ahead", http.MethodPost, "/meeting-documents",
		upload(time.Now().Year()+2), 422)
	expect("document for next year", http.MethodPost, "/meeting-documents",
		upload(time.Now().Year()+1), 201)
}
