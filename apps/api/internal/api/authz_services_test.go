package api

import (
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/dsek-lth/web/apps/api/internal/apinames"
)

func TestSongAccess(t *testing.T) {
	e := requireDB(t)
	song := map[string]any{"title": "Authz song", "lyrics": "La la la"}
	for _, p := range []string{
		"/songs", "/songs/categories", "/songs/categories/grouped",
		"/songs/melodies", "/songbook-entries",
	} {
		e.check(t, e.gate(http.MethodGet, p, nil, ok, apinames.SongRead))
	}
	e.check(t, e.gate(http.MethodPost, "/songs", song, ok, apinames.SongCreate))
	slug := e.one(t, `SELECT slug FROM songs WHERE title = 'Authz song'`)
	path := "/songs/" + slug
	e.check(t, e.gate(http.MethodGet, path, nil, ok, apinames.SongRead))
	e.check(t, e.gate(http.MethodPut, path, song, ok, apinames.SongUpdate))

	songID := e.one(t, `SELECT id::text FROM songs WHERE slug = $1`, slug)
	entry := map[string]any{"songId": songID, "page": 900, "numberOnPage": 1}
	e.check(t, e.gate(http.MethodPost, "/songbook-entries", entry, ok, apinames.SongCreate))
	e.check(t, e.gate(http.MethodGet, "/songbook-entries/900/1", nil, ok, apinames.SongRead))
	entry["numberOnPage"] = 2
	e.check(t, e.gate(http.MethodPut, "/songbook-entries/900/1", entry, ok, apinames.SongUpdate))
	e.check(t, e.gate(http.MethodDelete, "/songbook-entries/900/2", nil, ok, apinames.SongDelete))

	// A deleted song is only shown to someone who may restore it.
	e.check(t, e.gate(http.MethodDelete, path, nil, ok, apinames.SongDelete))
	e.check(t, []accessCase{
		{e.as(1, apinames.SongRead), http.MethodGet, path, nil, hidden},
		{e.as(1, apinames.SongRead, apinames.SongDelete), http.MethodGet, path, nil, ok},
	})
	e.check(t, e.gate(http.MethodPost, path+"/restore", nil, ok, apinames.SongDelete))
}

func TestInfoPageAccess(t *testing.T) {
	e := requireDB(t)
	page := map[string]any{"markdownSv": "Text"}
	e.check(t, e.gate(http.MethodPost, "/info-pages/authz-page", page, ok, apinames.MarkdownCreate))
	// Editing: markdown:update, or the per-page grant its creator got.
	e.check(t, []accessCase{
		{anonymous, http.MethodPut, "/info-pages/authz-page", page, denied},
		{e.as(2), http.MethodPut, "/info-pages/authz-page", page, denied},
		{
			e.as(2, "markdowns:other-page:update"),
			http.MethodPut,
			"/info-pages/authz-page",
			page,
			denied,
		},
		{
			e.as(2, "markdowns:authz-page:update"),
			http.MethodPut,
			"/info-pages/authz-page",
			page,
			ok,
		},
		{e.as(2, apinames.MarkdownUpdate), http.MethodPut, "/info-pages/authz-page", page, ok},
	})
}

func TestAlertAccess(t *testing.T) {
	e := requireDB(t)
	alert := map[string]any{"severity": "info", "messageSv": "Authz", "messageEn": "Authz"}
	e.check(t, e.gate(http.MethodPost, "/alerts", alert, ok, apinames.AlertManage))
	id := e.one(t, `SELECT id::text FROM alerts WHERE message_sv = 'Authz'`)
	e.check(t, []accessCase{
		{anonymous, http.MethodPost, "/alerts/" + id + "/dismiss", nil, denied},
		{e.as(2), http.MethodPost, "/alerts/" + id + "/dismiss", nil, ok},
	})
	e.check(t, e.gate(http.MethodDelete, "/alerts/"+id, nil, ok, apinames.AlertManage))
}

func TestElectionAccess(t *testing.T) {
	e := requireDB(t)
	election := map[string]any{
		"committeeId": e.one(t, `SELECT id::text FROM committees ORDER BY short_name LIMIT 1`),
		"markdownSv":  "Authz election", "link": "https://example.com/vote",
		"expiresAt": time.Now().Add(7 * 24 * time.Hour),
	}
	e.check(t, e.gate(http.MethodPost, "/elections", election, ok, apinames.ElectionCreate))
	path := "/elections/" + e.one(
		t,
		`SELECT id::text FROM elections WHERE markdown_sv = 'Authz election'`,
	)
	e.check(t, e.gate(http.MethodPut, path, election, ok, apinames.ElectionUpdate))
	e.check(t, e.gate(http.MethodDelete, path, nil, ok, apinames.ElectionDelete))
}

func TestGoverningDocumentAccess(t *testing.T) {
	e := requireDB(t)
	doc := map[string]any{
		"title": "Authz policy",
		"url":   "https://example.com/p.pdf",
		"type":  "POLICY",
	}
	e.check(
		t,
		e.gate(http.MethodGet, "/governing-documents", nil, ok, apinames.GoverningDocumentRead),
	)
	e.check(
		t,
		e.gate(http.MethodPost, "/governing-documents", doc, ok, apinames.GoverningDocumentWrite),
	)
	path := "/governing-documents/" + e.one(
		t,
		`SELECT id::text FROM documents WHERE title = 'Authz policy'`,
	)
	e.check(t, e.gate(http.MethodGet, path, nil, ok, apinames.GoverningDocumentRead))
	e.check(t, e.gate(http.MethodPut, path, doc, ok, apinames.GoverningDocumentWrite))
	e.check(t, e.gate(http.MethodDelete, path, nil, ok, apinames.GoverningDocumentWrite))
}

func TestCafeAccess(t *testing.T) {
	e := requireDB(t)
	e.check(
		t,
		e.gate(http.MethodPut, "/cafe/ciabattas/2030/10", map[string]any{"name": "Authz"}, ok,
			apinames.CafeEditCiabattas),
	)

	// Signing up for a shift: any member, for themselves; putting someone
	// else on one needs cafe:edit_workers.
	next := time.Now().AddDate(0, 0, 7)
	date := next.Format(time.DateOnly)
	own := map[string]any{"date": date, "timeSlot": "SHIFT_2"}
	other := map[string]any{
		"date":      date,
		"timeSlot":  "SHIFT_3",
		"studentId": e.members[3].StudentID,
	}
	e.check(t, []accessCase{
		{anonymous, http.MethodPost, "/cafe/shifts/toggle", own, denied},
		{e.as(2), http.MethodPost, "/cafe/shifts/toggle", own, ok},
		{e.as(2), http.MethodPost, "/cafe/shifts/toggle", other, denied},
		{e.as(2, apinames.CafeEditWorkers), http.MethodPost, "/cafe/shifts/toggle", other, ok},
	})

	// Weeks further than two ahead need cafe:see_all_weeks.
	far := time.Now().AddDate(0, 0, 60)
	year, week := far.ISOWeek()
	farPath := fmt.Sprintf("/cafe/schedule?year=%d&week=%d", year, week)
	e.check(t, []accessCase{
		{e.as(2), http.MethodGet, "/cafe/schedule", nil, ok},
		{e.as(2), http.MethodGet, farPath, nil, denied},
		{e.as(2, apinames.CafeSeeAllWeeks), http.MethodGet, farPath, nil, ok},
	})
}

func TestBookingAccess(t *testing.T) {
	e := requireDB(t)
	e.check(t, e.gate(http.MethodGet, "/bookable-categories", nil, ok, apinames.BookableRead))
	e.check(
		t,
		e.gate(http.MethodPost, "/bookable-categories", map[string]any{"nameSv": "Authz cat"},
			ok, apinames.BookableCreate),
	)
	category := e.one(t, `SELECT id::text FROM bookable_categories WHERE name_sv = 'Authz cat'`)
	e.check(t, e.gate(http.MethodPut, "/bookable-categories/"+category,
		map[string]any{"nameSv": "Authz cat"}, ok, apinames.BookableUpdate))
	bookable := map[string]any{"nameSv": "Authz room", "isDisabled": false, "categoryId": category}
	e.check(t, e.gate(http.MethodGet, "/bookables", nil, ok, apinames.BookableRead))
	e.check(t, e.gate(http.MethodPost, "/bookables", bookable, ok, apinames.BookableCreate))
	bookableID := e.one(t, `SELECT id::text FROM bookables WHERE name_sv = 'Authz room'`)
	e.check(t, e.gate(http.MethodGet, "/bookables/"+bookableID, nil, ok, apinames.BookableRead))
	e.check(
		t,
		e.gate(http.MethodPut, "/bookables/"+bookableID, bookable, ok, apinames.BookableUpdate),
	)
	e.check(t, e.gate(http.MethodGet, "/booking-doors", nil, ok, apinames.BookingRequestCreate))

	start := time.Now().Add(10 * 24 * time.Hour).Truncate(time.Hour)
	request := func(event string) map[string]any {
		return map[string]any{
			"event": event,
			"start": start,
			"end":   start.Add(2 * time.Hour),
			"bookableIds": []string{
				bookableID,
			},
			"accessDoors":     []string{},
			"accessMemberIds": []string{},
		}
	}
	// Member 1 books; they may edit and delete their own request.
	e.check(t, e.gate(http.MethodPost, "/booking-requests", request("Authz booking"), ok,
		apinames.BookingRequestCreate))
	path := "/booking-requests/" + e.one(t,
		`SELECT id::text FROM booking_requests WHERE event = 'Authz booking'`)
	e.check(t, e.gate(http.MethodGet, "/booking-requests", nil, ok, apinames.BookingRequestRead))
	e.check(t, e.gate(http.MethodGet, path, nil, ok, apinames.BookingRequestRead))
	e.check(t, e.gate(http.MethodGet, "/booking-requests/review-queue", nil, ok,
		apinames.BookingRequestUpdate))
	e.check(t, []accessCase{
		{anonymous, http.MethodPut, path, request("Authz booking"), denied},
		{e.as(2), http.MethodPut, path, request("Authz booking"), denied},
		{e.as(1), http.MethodPut, path, request("Authz booking"), ok},
		{
			e.as(2, apinames.BookingRequestUpdate),
			http.MethodPut,
			path,
			request("Authz booking"),
			ok,
		},
	})
	e.check(t, e.gate(http.MethodPost, path+"/accept", nil, ok, apinames.BookingRequestUpdate))
	e.check(t, e.gate(http.MethodPost, path+"/reject", nil, ok, apinames.BookingRequestUpdate))
	e.check(t, []accessCase{
		{anonymous, http.MethodDelete, path, nil, denied},
		{e.as(2), http.MethodDelete, path, nil, denied},
		{e.as(1), http.MethodDelete, path, nil, ok},
	})
	e.mustCall(t, e.as(1, apinames.BookingRequestCreate), http.MethodPost, "/booking-requests",
		request("Authz booking 2"))
	second := "/booking-requests/" + e.one(t,
		`SELECT id::text FROM booking_requests WHERE event = 'Authz booking 2'`)
	e.check(t, []accessCase{
		{e.as(2, apinames.BookingRequestDelete), http.MethodDelete, second, nil, ok},
	})
}

func TestNotificationAccess(t *testing.T) {
	e := requireDB(t)
	settings := map[string]any{
		"subscriptions": []string{}, "pushSubscriptions": []string{},
		"subscribedTagIds": []string{},
	}
	for _, op := range []struct {
		method, path string
		body         any
	}{
		{http.MethodGet, "/notifications", nil},
		{http.MethodGet, "/notifications/unread-count", nil},
		{http.MethodPost, "/notifications/mark-read", nil},
		{http.MethodDelete, "/notifications", nil},
		{http.MethodGet, "/notification-settings", nil},
		{http.MethodPut, "/notification-settings", settings},
		{http.MethodPut, "/notifications/push-token", map[string]any{"token": "ExponentPushToken[authz]"}},
		{http.MethodGet, "/me/tickets", nil},
	} {
		e.check(t, []accessCase{
			{anonymous, op.method, op.path, op.body, denied},
			{e.as(2), op.method, op.path, op.body, ok},
		})
	}
	e.check(t, []accessCase{{anonymous, http.MethodGet, "/me", nil, ok}})
}

func TestAdminAccess(t *testing.T) {
	e := requireDB(t)
	e.check(t, e.gate(http.MethodGet, "/admin-settings", nil, ok, apinames.AdminSettingsRead))
	e.check(t, e.gate(http.MethodPut, "/admin-settings/authz", map[string]any{"value": "x"}, ok,
		apinames.AdminSettingsUpdate))
	e.check(
		t,
		e.gate(http.MethodDelete, "/admin-settings/authz", nil, ok, apinames.AdminSettingsDelete),
	)

	// Shlink isn't configured here, so an allowed call fails upstream.
	link := map[string]any{"url": "https://example.com", "slug": "authz", "tags": []string{}}
	e.check(t, e.gate(http.MethodGet, "/links", nil, allowed, apinames.AdminShlinkRead))
	e.check(t, e.gate(http.MethodGet, "/links/tags", nil, allowed, apinames.AdminShlinkRead))
	e.check(t, e.gate(http.MethodGet, "/links/domains", nil, allowed, apinames.AdminShlinkRead))
	e.check(t, e.gate(http.MethodPost, "/links", link, allowed, apinames.AdminShlinkCreate))
	e.check(t, e.gate(http.MethodPut, "/links/authz",
		map[string]any{"url": "https://example.com", "tags": []string{}}, allowed,
		apinames.AdminShlinkUpdate))
	e.check(t, e.gate(http.MethodDelete, "/links", map[string]any{"shortCodes": []string{"authz"}},
		allowed, apinames.AdminShlinkDelete))

	// Search isn't configured either.
	e.check(t, e.gate(http.MethodPost, "/search/sync", nil, unavailable, apinames.CoreAdmin))
}

func TestFileAccess(t *testing.T) {
	e := requireDB(t)
	upload := form{files: map[string][]formFile{"file": {pngFile}}}
	e.check(t, e.gate(http.MethodGet, "/files", nil, ok, apinames.FileFilesRead))
	e.check(t, e.gate(http.MethodPost, "/files", upload, ok, apinames.FileFilesCreate))
	e.check(t, e.gate(http.MethodDelete, "/files?key=public/miscellaneous/x.png", nil, allowed,
		apinames.FileFilesDelete))
	e.check(t, []accessCase{
		{anonymous, http.MethodGet, "/files/x.png", nil, denied},
		{e.as(2), http.MethodGet, "/files/x.png", nil, allowed},
	})

	year := time.Now().Year()
	meetings := fmt.Sprintf("/meeting-documents?type=board-meeting&year=%d", year)
	srd := fmt.Sprintf("/meeting-documents?type=SRD-meeting&year=%d", year)
	e.check(t, e.gate(http.MethodGet, meetings, nil, ok, apinames.FileDocumentsRead))
	// SRD documents live in the files bucket.
	e.check(t, []accessCase{
		{e.as(2, apinames.FileDocumentsRead), http.MethodGet, srd, nil, denied},
		{e.as(2, apinames.FileDocumentsRead, apinames.FileFilesRead), http.MethodGet, srd, nil, ok},
	})
	meetingUpload := func(kind string) form {
		return form{
			fields: map[string]string{
				"type":   kind,
				"year":   fmt.Sprint(year),
				"folder": "S01",
				"name":   "x",
			},
			files: map[string][]formFile{"file": {pngFile}},
		}
	}
	e.check(t, e.gate(http.MethodPost, "/meeting-documents", meetingUpload("meeting"), ok,
		apinames.FileDocumentsCreate))
	e.check(t, []accessCase{
		{
			e.as(2, apinames.FileDocumentsCreate), http.MethodPost, "/meeting-documents",
			meetingUpload("srd"), denied,
		},
		{
			e.as(2, apinames.FileFilesCreate), http.MethodPost, "/meeting-documents",
			meetingUpload("srd"), ok,
		},
	})
	e.check(t, e.gate(http.MethodDelete,
		fmt.Sprintf("/meeting-documents?type=board-meeting&key=public/%d/S01/x.png", year), nil,
		allowed, apinames.FileDocumentsDelete))
	rename := map[string]string{"name": "y.png", "group": "Motion"}
	e.check(t, e.gate(http.MethodPut,
		fmt.Sprintf("/meeting-documents?type=board-meeting&key=public/%d/S01/x.png", year), rename,
		ok, apinames.FileDocumentsUpdate))
	// The files bucket's SRD files need that bucket's update policy.
	srdFile := fmt.Sprintf("/meeting-documents?type=SRD-meeting&key=public/srd/%d/SRD1/x.png", year)
	e.check(t, []accessCase{
		{e.as(2, apinames.FileDocumentsUpdate), http.MethodPut, srdFile, rename, denied},
		{e.as(2, apinames.FileFilesUpdate), http.MethodPut, srdFile, rename, ok},
	})

	profiles := fmt.Sprintf("/requirement-profiles?year=%d", year)
	e.check(t, e.gate(http.MethodGet, profiles, nil, ok, apinames.FileFilesRead))
	e.check(t, e.gate(http.MethodPost, "/requirement-profiles", form{
		fields: map[string]string{"year": fmt.Sprint(year), "folder": "cpu", "name": "x"},
		files:  map[string][]formFile{"file": {pngFile}},
	}, ok, apinames.FileFilesCreate))
	e.check(t, e.gate(http.MethodDelete, "/requirement-profiles?key=public/kravprofiler/x.png", nil,
		allowed, apinames.FileFilesDelete))

	e.check(t, e.gate(http.MethodGet, "/albums", nil, ok, apinames.FileAlbumsRead))
	e.check(
		t,
		e.gate(http.MethodGet, "/albums/2030-01-01%20Authz", nil, allowed, apinames.FileAlbumsRead),
	)
	e.check(t, e.gate(http.MethodPost, "/albums", form{
		fields: map[string]string{"name": "Authz", "date": "2030-01-01"},
		files:  map[string][]formFile{"files": {pngFile}},
	}, ok, apinames.FileAlbumsCreate))
}

func TestTicketAccess(t *testing.T) {
	e := requireDB(t)
	e.mustCall(
		t,
		e.as(1, apinames.EventCreate),
		http.MethodPost,
		"/events",
		eventBody("Authz party"),
	)
	eventID := e.one(t, `SELECT id::text FROM events WHERE title_sv = 'Authz party'`)
	opens := time.Now().Add(24 * time.Hour)
	release := map[string]any{
		"eventId": eventID, "title": "Authz tickets", "quantity": 10,
		"opensAt": opens, "closesAt": opens.Add(time.Hour),
	}
	e.check(t, e.gate(http.MethodPost, "/ticket-releases", release, ok, apinames.WebshopCreate))
	path := "/ticket-releases/" + e.one(
		t,
		`SELECT id::text FROM ticket_release WHERE title = 'Authz tickets'`,
	)
	e.check(t, e.gate(http.MethodPut, path, map[string]any{
		"title": "Authz tickets", "quantity": 12,
		"closesAt": opens.Add(time.Hour),
	}, ok, apinames.WebshopManage))
	e.check(t, e.gate(http.MethodGet, path+"/roster", nil, ok, apinames.WebshopManage))
	e.check(t, e.gate(http.MethodGet, "/ticket-releases?includeExpired=true", nil, ok,
		apinames.WebshopCreate))

	// The release hasn't opened, so a member's own actions are refused - but
	// not by the authorization check.
	for _, op := range []struct{ method, path string }{
		{http.MethodPost, path + "/request"},
		{http.MethodGet, path + "/request"},
		{http.MethodDelete, path + "/request"},
		{http.MethodPost, path + "/accept"},
	} {
		e.check(t, []accessCase{
			{anonymous, op.method, op.path, nil, denied},
			{e.as(2), op.method, op.path, nil, allowed},
		})
	}
}

// TestNoAnonymousWrites sends every write operation, with placeholder path
// parameters and an empty body, as an anonymous caller: none may succeed or
// fail with a server error. It catches a new operation that forgets its
// authorization check; the cases above check each one properly.
func TestNoAnonymousWrites(t *testing.T) {
	e := requireDB(t)
	for path, item := range openAPI(t).Paths {
		for method, op := range map[string]any{
			http.MethodPost: item.Post, http.MethodPut: item.Put, http.MethodDelete: item.Delete,
		} {
			if isNil(op) {
				continue
			}
			concrete := placeholderPath(path)
			res := e.call(t, anonymous, method, concrete, map[string]any{})
			if res.status < 300 || res.status >= 500 {
				t.Errorf("%s %s as anonymous: got %d: %s", method, concrete, res.status,
					truncate(res.body))
			}
		}
	}
}

func isNil(op any) bool {
	switch o := op.(type) {
	case nil:
		return true
	default:
		return fmt.Sprint(o) == "<nil>"
	}
}

// placeholderPath fills every {param} with a value of the right shape.
func placeholderPath(path string) string {
	replacements := map[string]string{
		"{year}": "2030", "{week}": "10", "{page}": "1", "{numberOnPage}": "1",
		"{studentId}": "ab1234cd-s",
	}
	for k, v := range replacements {
		path = strings.ReplaceAll(path, k, v)
	}
	for strings.Contains(path, "{") {
		start := strings.Index(path, "{")
		end := strings.Index(path, "}")
		path = path[:start] + "00000000-0000-0000-0000-000000000000" + path[end+1:]
	}
	return path
}

// TestPublicReads checks that what anyone may read stays readable without
// signing in.
func TestPublicReads(t *testing.T) {
	e := requireDB(t)
	article := e.one(
		t,
		`SELECT slug FROM articles WHERE removed_at IS NULL AND published_datetime <= now() LIMIT 1`,
	)
	event := e.one(t, `SELECT slug FROM events WHERE removed_at IS NULL LIMIT 1`)
	committee := e.one(t, `SELECT short_name FROM committees WHERE short_name IS NOT NULL LIMIT 1`)
	position := e.one(t, `SELECT id FROM positions LIMIT 1`)
	for _, p := range []string{
		"/alarm", "/alerts", "/articles", "/articles/" + article, "/board", "/cafe/opening-hours",
		"/committees", "/committees/" + committee, "/custom-authors", "/elections", "/events",
		"/events/" + event, "/events.ics", "/nollning/current", "/nollning/events.ics",
		"/nollning/phadder-groups", "/nollning/seasons", "/positions", "/positions/" + position,
		"/tags", "/ticket-releases", "/me",
	} {
		e.check(t, []accessCase{{anonymous, http.MethodGet, p, nil, ok}})
	}
}

// GET /positions carries each position's committee, which /positions groups
// by.
func TestPositionsListCarriesCommittee(t *testing.T) {
	e := requireDB(t)
	id := e.one(t, `SELECT id FROM positions WHERE committee_id IS NOT NULL LIMIT 1`)
	shortName := e.one(
		t,
		`SELECT c.short_name FROM positions p JOIN committees c ON c.id = p.committee_id WHERE p.id = $1`,
		id,
	)
	var positions []struct {
		ID        string `json:"id"`
		Committee *struct {
			Name      string `json:"name"`
			ShortName string `json:"shortName"`
		} `json:"committee"`
	}
	e.mustCall(t, anonymous, http.MethodGet, "/positions", nil).decode(t, &positions)
	for _, p := range positions {
		if p.ID != id {
			continue
		}
		if p.Committee == nil || p.Committee.ShortName != shortName || p.Committee.Name == "" {
			t.Fatalf("position %s: committee %+v, want %s", id, p.Committee, shortName)
		}
		return
	}
	t.Fatalf("position %s not listed", id)
}
