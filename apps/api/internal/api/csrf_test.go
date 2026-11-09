package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCrossOriginProtection(t *testing.T) {
	const frontend = "https://www.dsek.se"
	reached := false
	handler := withCORS(frontend)(withCrossOriginProtection(frontend + "/")(
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			reached = true
			w.WriteHeader(http.StatusOK)
		}),
	))

	for _, tc := range []struct {
		name    string
		method  string
		headers map[string]string
		want    int
	}{
		{
			name:    "frontend in a browser",
			method:  http.MethodPost,
			headers: map[string]string{"Sec-Fetch-Site": "same-site", "Origin": frontend},
			want:    http.StatusOK,
		},
		{
			name:    "frontend in an old browser",
			method:  http.MethodDelete,
			headers: map[string]string{"Origin": frontend},
			want:    http.StatusOK,
		},
		{
			name:    "API docs page on the API's own origin",
			method:  http.MethodPut,
			headers: map[string]string{"Sec-Fetch-Site": "same-origin", "Origin": "https://api.dsek.se"},
			want:    http.StatusOK,
		},
		{
			name:   "server-to-server (SvelteKit, cron, native app)",
			method: http.MethodPost,
			want:   http.StatusOK,
		},
		{
			name:    "sibling host",
			method:  http.MethodPost,
			headers: map[string]string{"Sec-Fetch-Site": "same-site", "Origin": "https://evil.dsek.se"},
			want:    http.StatusForbidden,
		},
		{
			name:    "other site",
			method:  http.MethodPost,
			headers: map[string]string{"Sec-Fetch-Site": "cross-site", "Origin": "https://evil.example"},
			want:    http.StatusForbidden,
		},
		{
			name:    "other site in an old browser",
			method:  http.MethodPut,
			headers: map[string]string{"Origin": "https://evil.example"},
			want:    http.StatusForbidden,
		},
		{
			name:    "cross-site GET (login links)",
			method:  http.MethodGet,
			headers: map[string]string{"Sec-Fetch-Site": "cross-site", "Origin": "https://evil.example"},
			want:    http.StatusOK,
		},
		{
			name:    "preflight",
			method:  http.MethodOptions,
			headers: map[string]string{"Sec-Fetch-Site": "same-site", "Origin": frontend},
			want:    http.StatusNoContent,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			reached = false
			req := httptest.NewRequest(tc.method, "https://api.dsek.se/articles", nil)
			for k, v := range tc.headers {
				req.Header.Set(k, v)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			if rec.Code != tc.want {
				t.Fatalf("status %d, want %d: %s", rec.Code, tc.want, rec.Body)
			}
			if tc.want == http.StatusForbidden {
				if reached {
					t.Error("rejected request reached the handler")
				}
				ct := rec.Header().Get("Content-Type")
				if !strings.HasPrefix(ct, "application/problem+json") {
					t.Errorf("Content-Type %q, want application/problem+json", ct)
				}
				if rec.Header().Get("Access-Control-Allow-Origin") != frontend {
					t.Error("rejection has no CORS headers")
				}
			}
		})
	}
}
