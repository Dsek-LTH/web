package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"golang.org/x/oauth2"
)

// rotatingTokenServer is a token endpoint that, like Authentik, rotates the
// refresh token on every use and rejects a spent one.
func rotatingTokenServer(t *testing.T) (*httptest.Server, *int) {
	t.Helper()
	var mu sync.Mutex
	valid := map[string]bool{"rt-1": true}
	exchanges := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		rt := r.FormValue("refresh_token")
		w.Header().Set("Content-Type", "application/json")
		if !valid[rt] {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid_grant"})
			return
		}
		delete(valid, rt)
		exchanges++
		next := rt + "'"
		valid[next] = true
		_ = json.NewEncoder(w).Encode(map[string]any{
			"access_token":  "at",
			"token_type":    "Bearer",
			"expires_in":    300,
			"refresh_token": next,
		})
	}))
	t.Cleanup(srv.Close)
	return srv, &exchanges
}

func TestRefreshReplayOfRotatedTokenGetsSameSession(t *testing.T) {
	srv, exchanges := rotatingTokenServer(t)
	c := &OIDCClient{oauth2Config: oauth2.Config{
		ClientID: "client",
		Endpoint: oauth2.Endpoint{TokenURL: srv.URL, AuthStyle: oauth2.AuthStyleInParams},
	}}
	stale := SessionData{StudentID: "ab1234cd-s", RefreshToken: "rt-1"}

	first, err := c.Refresh(context.Background(), stale)
	if err != nil {
		t.Fatalf("first refresh: %v", err)
	}
	// The same expired cookie again, after the first exchange finished.
	second, err := c.Refresh(context.Background(), stale)
	if err != nil {
		t.Fatalf("replayed refresh: %v", err)
	}
	if second.RefreshToken != first.RefreshToken || second.RefreshToken == "rt-1" {
		t.Errorf(
			"replay got refresh token %q, want the rotated %q",
			second.RefreshToken,
			first.RefreshToken,
		)
	}
	if *exchanges != 1 {
		t.Errorf("token endpoint used %d times, want 1", *exchanges)
	}

	// Past the grace window the spent token is Authentik's call again.
	c.recentRefreshesMu.Lock()
	r := c.recentRefreshes["rt-1"]
	r.at = r.at.Add(-2 * refreshGrace)
	c.recentRefreshes["rt-1"] = r
	c.recentRefreshesMu.Unlock()
	if _, err := c.Refresh(context.Background(), stale); err == nil {
		t.Error("refresh with a spent token after the grace window succeeded")
	}
}
