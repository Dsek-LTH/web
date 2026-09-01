// Package locale resolves which language a response should be shown in,
// replacing the old Prisma `translationExtension`'s job. The site only
// ever supports "sv"/"en" (matching paraglide's locale set), so this is a
// coarse Accept-Language check, not full RFC 4647 language negotiation -
// the frontend is expected to send Accept-Language set to its own resolved
// locale (from paraglide's getLocale()), not left to the browser's
// default, so a switch in the site's language picker is honored even if it
// doesn't match the browser's own locale.
package locale

import (
	"context"
	"net/http"
	"strings"
)

type ctxKey struct{}

// Middleware extracts the locale from the request's Accept-Language header
// and attaches it to the request context for internal/articles' response
// builders to read via FromContext.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), ctxKey{}, resolve(r.Header.Get("Accept-Language")))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func resolve(acceptLanguage string) string {
	first, _, _ := strings.Cut(acceptLanguage, ",")
	if strings.HasPrefix(strings.ToLower(strings.TrimSpace(first)), "en") {
		return "en"
	}
	return "sv"
}

// FromContext returns the resolved locale ("sv" or "en"), defaulting to
// "sv" if Middleware never ran (e.g. in a test calling the service
// directly).
func FromContext(ctx context.Context) string {
	if loc, ok := ctx.Value(ctxKey{}).(string); ok {
		return loc
	}
	return "sv"
}
