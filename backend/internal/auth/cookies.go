package auth

import (
	"net/http"
	"os"
)

// CookieDomain scopes the session cookie to the same registrable domain
// SvelteKit runs on, so both origins can read it despite being different
// ports (dev) or subdomains (prod) - see DESIGN.md's Auth section. Set
// AUTH_COOKIE_DOMAIN explicitly for any non-localhost environment; there is
// no environment-detection fallback here, only a dev-friendly default.
func CookieDomain() string {
	if d := os.Getenv("AUTH_COOKIE_DOMAIN"); d != "" {
		return d
	}
	return "localhost"
}

// cookieSecure reports whether the session cookie should carry the Secure
// attribute. Explicit env var rather than an environment guess, same "loud,
// never a silent default" principle DESIGN.md already applies to AUTH_MOCK -
// must be set true in any deployment actually served over HTTPS.
func cookieSecure() bool {
	return os.Getenv("AUTH_COOKIE_SECURE") == "true"
}

// SetSessionCookie encodes data and sets it as the session cookie.
// SameSite=Lax is sufficient (not None) because SvelteKit and this API are
// same-site (same registrable domain) even though cross-origin.
func SetSessionCookie(w http.ResponseWriter, codec *SessionCodec, data SessionData) error {
	value, err := codec.Encode(data)
	if err != nil {
		return err
	}
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    value,
		Domain:   CookieDomain(),
		Path:     "/",
		HttpOnly: true,
		Secure:   cookieSecure(),
		SameSite: http.SameSiteLaxMode,
	})
	return nil
}

// ClearSessionCookie expires the session cookie immediately (logout).
func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Domain:   CookieDomain(),
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   cookieSecure(),
		SameSite: http.SameSiteLaxMode,
	})
}
