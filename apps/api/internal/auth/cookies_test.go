package auth

import "testing"

func TestCookieSecure(t *testing.T) {
	cases := []struct {
		secure, frontend string
		want             bool
	}{
		{"", "https://www.dsek.se", true},
		{"", "http://localhost:5173", false},
		{"true", "http://localhost:5173", true},
		{"false", "https://www.dsek.se", false},
	}
	for _, c := range cases {
		t.Setenv("AUTH_COOKIE_SECURE", c.secure)
		t.Setenv("PUBLIC_FRONTEND_URL", c.frontend)
		if got := cookieSecure(); got != c.want {
			t.Errorf("AUTH_COOKIE_SECURE=%q, PUBLIC_FRONTEND_URL=%q: got %v, want %v",
				c.secure, c.frontend, got, c.want)
		}
	}
}
