package api

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"testing"
)

func TestRequestLog(t *testing.T) {
	e := requireDB(t)
	var buf bytes.Buffer
	slog.SetDefault(slog.New(slog.NewJSONHandler(&buf, nil)))
	defer slog.SetDefault(slog.New(slog.DiscardHandler))

	slug := e.one(
		t,
		`SELECT slug FROM articles WHERE removed_at IS NULL AND published_datetime <= now() LIMIT 1`,
	)
	e.mustCall(t, e.as(2), http.MethodGet, "/articles/"+slug, nil)
	e.call(t, anonymous, http.MethodGet, "/articles/no-such-article", nil)

	var lines []map[string]any
	for _, line := range strings.Split(strings.TrimSpace(buf.String()), "\n") {
		var m map[string]any
		if err := json.Unmarshal([]byte(line), &m); err != nil {
			t.Fatalf("not JSON: %s", line)
		}
		if m["msg"] == "request" {
			lines = append(lines, m)
		}
	}
	if len(lines) != 2 {
		t.Fatalf("got %d request lines, want 2: %s", len(lines), buf.String())
	}
	for i, want := range []map[string]any{
		{"method": "GET", "route": "/articles/{slug}", "status": float64(200), "member_id": e.members[2].ID},
		{"method": "GET", "route": "/articles/{slug}", "status": float64(404)},
	} {
		for k, v := range want {
			if lines[i][k] != v {
				t.Errorf("request %d: %s = %v, want %v", i, k, lines[i][k], v)
			}
		}
		if _, ok := lines[i]["duration_ms"]; !ok {
			t.Errorf("request %d: no duration_ms", i)
		}
	}
	if _, ok := lines[1]["member_id"]; ok {
		t.Errorf("anonymous request has a member_id")
	}
}
