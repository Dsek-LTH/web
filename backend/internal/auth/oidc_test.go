package auth

import "testing"

func TestSafeReturnTo(t *testing.T) {
	for in, want := range map[string]string{
		"":                   "/",
		"/":                  "/",
		"/news?page=2":       "/news?page=2",
		"@evil.example/":     "/",
		".evil.example/":     "/",
		"evil.example":       "/",
		"//evil.example/":    "/",
		"/\\evil.example/":   "/",
		"https://evil.test/": "/",
	} {
		if got := safeReturnTo(in); got != want {
			t.Errorf("safeReturnTo(%q) = %q, want %q", in, got, want)
		}
	}
}
