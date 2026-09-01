// Package api wires the article/tag/upload endpoints through huma
// (github.com/danielgtaylor/huma/v2) on top of the stdlib net/http mux -
// see huma_articles.go and ../../DESIGN.md's "API shape and frontend
// integration" section for why.
package api

import (
	"log"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"

	"github.com/dsek-lth/web/backend/internal/articles"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/events"
	"github.com/dsek-lth/web/backend/internal/locale"
)

// NewRouter registers every endpoint. Every request is authenticated via
// authenticator before reaching a handler; handlers and Service methods
// read "who is doing this" from the request context (see internal/auth),
// never from the request body. oidcClient is nil when AUTH_MOCK is active
// (see main.go) - /auth/login, /auth/callback, /auth/logout are simply not
// registered in that case, same as a real deployment never mocking auth.
func NewRouter(
	articleSvc *articles.Service,
	eventSvc *events.Service,
	authenticator auth.Authenticator,
	oidcClient *auth.OIDCClient,
	queries *db.Queries,
	frontendOrigin string,
) http.Handler {
	mux := http.NewServeMux()
	api := humago.New(mux, huma.DefaultConfig("Dsek Articles API", "0.1.0"))
	registerArticleRoutes(api, articleSvc)
	registerDirectoryRoutes(api, articleSvc)
	registerEventRoutes(api, eventSvc)

	mux.HandleFunc("GET /me", auth.MeHandler(queries))
	if oidcClient != nil {
		mux.HandleFunc("GET /auth/login", oidcClient.LoginHandler)
		mux.HandleFunc("GET /auth/callback", oidcClient.CallbackHandler)
		mux.HandleFunc("GET /auth/logout", oidcClient.LogoutHandler)
	}

	return withLogging(
		withCORS(frontendOrigin)(auth.Middleware(authenticator)(locale.Middleware(mux))),
	)
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

// withCORS echoes allowedOrigin (SvelteKit's own origin, PUBLIC_FRONTEND_URL)
// rather than "*", and sets Allow-Credentials - required now that the
// session cookie (see internal/auth) rides along on every request, since
// browsers reject "*" combined with credentialed requests outright. This is
// the revisit the old comment here flagged as coming once real auth
// existed.
func withCORS(allowedOrigin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept-Language")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
