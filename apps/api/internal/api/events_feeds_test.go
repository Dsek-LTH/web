package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// getICS fetches an ICS feed anonymously with the given Accept-Language
// (none if empty), the way SvelteKit's subscribe proxies call it.
func (e *environment) getICS(t *testing.T, path, acceptLanguage string) string {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	if acceptLanguage != "" {
		req.Header.Set("Accept-Language", acceptLanguage)
	}
	rec := httptest.NewRecorder()
	e.handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET %s: got %d: %s", path, rec.Code, truncate(rec.Body.Bytes()))
	}
	return rec.Body.String()
}

// The feeds' header tells calendar apps to refresh hourly, as the old ics
// library's did.
func TestCalendarFeedHeader(t *testing.T) {
	e := requireDB(t)
	const header = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nCALSCALE:GREGORIAN\r\n" +
		"PRODID:-//D-sektionen//Events//SV\r\nMETHOD:PUBLISH\r\nX-PUBLISHED-TTL:PT1H\r\n"
	for _, path := range []string{"/events.ics", "/nollning/events.ics"} {
		body := e.getICS(t, path, "")
		head := strings.TrimSuffix(body, "END:VCALENDAR\r\n")
		if i := strings.Index(body, "BEGIN:VEVENT"); i >= 0 {
			head = body[:i]
		}
		if head != header {
			t.Errorf("GET %s: header is %q, want %q", path, head, header)
		}
	}
}

// The feeds answer in the caller's language: SvelteKit passes the calendar
// app's Accept-Language on.
func TestCalendarFeedLanguage(t *testing.T) {
	e := requireDB(t)
	body := eventBody("ICS-testevenemang")
	body["titleEn"] = "ICS test event"
	e.mustCall(t, e.admin(), http.MethodPost, "/events", body)

	for _, c := range []struct {
		acceptLanguage, want, notWant string
	}{
		{"sv", "SUMMARY:ICS-testevenemang\r\n", "SUMMARY:ICS test event\r\n"},
		{"sv-SE,sv;q=0.9,en;q=0.8", "SUMMARY:ICS-testevenemang\r\n", "SUMMARY:ICS test event\r\n"},
		{"en", "SUMMARY:ICS test event\r\n", "SUMMARY:ICS-testevenemang\r\n"},
		{"", "SUMMARY:ICS test event\r\n", "SUMMARY:ICS-testevenemang\r\n"},
	} {
		ics := e.getICS(t, "/events.ics", c.acceptLanguage)
		if !strings.Contains(ics, c.want) || strings.Contains(ics, c.notWant) {
			t.Errorf("Accept-Language %q: want %q and not %q in the feed",
				c.acceptLanguage, c.want, c.notWant)
		}
	}
}
