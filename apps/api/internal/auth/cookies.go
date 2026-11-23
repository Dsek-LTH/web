package auth

import (
	"net/http"
	"os"
	"strings"
)

// CookieDomain scopes the session cookie to the same registrable domain
// SvelteKit runs on, so both origins can read it despite being different
// ports (dev) or subdomains (prod). Set
// AUTH_COOKIE_DOMAIN explicitly for any non-localhost environment; there is
// no environment-detection fallback here, only a dev-friendly default.
func CookieDomain() string {
	if d := os.Getenv("AUTH_COOKIE_DOMAIN"); d != "" {
		return d
	}
	return "localhost"
}

// cookieSecure reports whether the session cookies should carry the Secure
// attribute: AUTH_COOKIE_SECURE if it's set ("true"/"false"), otherwise
// whether the frontend is served over HTTPS (PUBLIC_FRONTEND_URL), so a
// deployment can't send the session over plain HTTP by forgetting a
// variable.
func cookieSecure() bool {
	switch os.Getenv("AUTH_COOKIE_SECURE") {
	case "true":
		return true
	case "false":
		return false
	}
	return strings.HasPrefix(os.Getenv("PUBLIC_FRONTEND_URL"), "https://")
}

// sessionCookieMaxAge keeps the session across browser restarts, as Auth.js's
// did. It is securecookie's own 30-day cap (see NewSessionCodec); a refresh
// token Authentik no longer accepts ends the session sooner.
const sessionCookieMaxAge = 30 * 24 * 60 * 60

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
		MaxAge:   sessionCookieMaxAge,
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
