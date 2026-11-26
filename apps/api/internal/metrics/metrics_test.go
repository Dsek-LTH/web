package metrics

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandlerNeedsTheToken(t *testing.T) {
	for _, tc := range []struct {
		token, header string
		want          int
	}{
		{"", "", http.StatusNotFound},
		{"", "Bearer ", http.StatusNotFound},
		{"secret", "", http.StatusNotFound},
		{"secret", "Bearer wrong", http.StatusNotFound},
		{"secret", "secret", http.StatusNotFound},
		{"secret", "Bearer secret", http.StatusOK},
	} {
		req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
		if tc.header != "" {
			req.Header.Set("Authorization", tc.header)
		}
		rec := httptest.NewRecorder()
		Handler(tc.token).ServeHTTP(rec, req)
		if rec.Code != tc.want {
			t.Errorf("token %q, header %q: got %d, want %d", tc.token, tc.header, rec.Code, tc.want)
		}
	}
}
