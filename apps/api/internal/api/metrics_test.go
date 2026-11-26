package api

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/dsek-lth/web/apps/api/internal/metrics"
)

// Requests are counted by route pattern, not path, so each operation is
// one series however many slugs it is called with.
func TestRequestMetricsUseTheRoute(t *testing.T) {
	e := requireDB(t)
	e.call(t, anonymous, http.MethodGet, "/articles/no-such-article", nil)
	e.call(t, anonymous, http.MethodGet, "/no/such/path", nil)
	// The harness has no METRICS_TOKEN, so its /metrics is hidden.
	if got := e.call(t, anonymous, http.MethodGet, "/metrics", nil); got.status != http.StatusNotFound {
		t.Errorf("/metrics without a token: got %d, want 404", got.status)
	}

	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req.Header.Set("Authorization", "Bearer t")
	rec := httptest.NewRecorder()
	metrics.Handler("t").ServeHTTP(rec, req)
	body, _ := io.ReadAll(rec.Body)
	for _, want := range []string{
		`http_requests_total{method="GET",route="/articles/{slug}",status_code="404"}`,
		`http_requests_total{method="GET",route="unmatched",status_code="404"}`,
		"inflight_requests 0",
		"push_notifications_messages_total",
	} {
		if !strings.Contains(string(body), want) {
			t.Errorf("metrics lack %s", want)
		}
	}
	if strings.Contains(string(body), "no-such-article") {
		t.Error("metrics name a path, not a route")
	}
}
