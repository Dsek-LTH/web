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

	"github.com/dsek-lth/web/backend/internal/accesspolicies"
	"github.com/dsek-lth/web/backend/internal/adminsettings"
	"github.com/dsek-lth/web/backend/internal/alerts"
	"github.com/dsek-lth/web/backend/internal/articles"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/booking"
	"github.com/dsek-lth/web/backend/internal/cafe"
	"github.com/dsek-lth/web/backend/internal/committees"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/documents"
	"github.com/dsek-lth/web/backend/internal/doors"
	"github.com/dsek-lth/web/backend/internal/elections"
	"github.com/dsek-lth/web/backend/internal/events"
	"github.com/dsek-lth/web/backend/internal/gallery"
	"github.com/dsek-lth/web/backend/internal/governingdocs"
	"github.com/dsek-lth/web/backend/internal/links"
	"github.com/dsek-lth/web/backend/internal/locale"
	"github.com/dsek-lth/web/backend/internal/markdown"
	"github.com/dsek-lth/web/backend/internal/medals"
	"github.com/dsek-lth/web/backend/internal/members"
	"github.com/dsek-lth/web/backend/internal/nollning"
	"github.com/dsek-lth/web/backend/internal/notifications"
	"github.com/dsek-lth/web/backend/internal/pings"
	"github.com/dsek-lth/web/backend/internal/readme"
	"github.com/dsek-lth/web/backend/internal/search"
	"github.com/dsek-lth/web/backend/internal/songs"
	"github.com/dsek-lth/web/backend/internal/tickets"
)

// Services is everything the API's handlers call into.
type Services struct {
	Articles        *articles.Service
	Events          *events.Service
	Members         *members.Service
	Committees      *committees.Service
	AccessPolicies  *accesspolicies.Service
	Nollning        *nollning.Service
	Songs           *songs.Service
	Alerts          *alerts.Service
	Markdown        *markdown.Service
	GoverningDocs   *governingdocs.Service
	Medals          *medals.Service
	Gallery         *gallery.Service
	Documents       *documents.Service
	Doors           *doors.Service
	Booking         *booking.Service
	Elections       *elections.Service
	Cafe            *cafe.Service
	Notifications   *notifications.Service
	AdminSettings   *adminsettings.Service
	Links           *links.Service
	Pings           *pings.Service
	Readme          *readme.Service
	Tickets         *tickets.Service
	TicketScheduler *tickets.Scheduler
	Search          *search.Service
	Queries         *db.Queries
	// SyncPassword guards POST /search/sync/password (SYNC_PASSWORD).
	SyncPassword string
}

// NewRouter registers every endpoint. Every request is authenticated via
// authenticator before reaching a handler; handlers and Service methods
// read "who is doing this" from the request context (see internal/auth),
// never from the request body. oidcClient is nil when AUTH_MOCK is active
// (see main.go) - /auth/login, /auth/callback, /auth/logout are simply not
// registered in that case, same as a real deployment never mocking auth.
func NewRouter(
	s Services,
	authenticator auth.Authenticator,
	oidcClient *auth.OIDCClient,
	frontendOrigin string,
) http.Handler {
	mux := http.NewServeMux()
	registerRoutes(mux, s)
	if oidcClient != nil {
		mux.HandleFunc("GET /auth/login", oidcClient.LoginHandler)
		mux.HandleFunc("GET /auth/callback", oidcClient.CallbackHandler)
		mux.HandleFunc("GET /auth/logout", oidcClient.LogoutHandler)
	}

	return withLogging(
		withCORS(frontendOrigin)(auth.Middleware(authenticator)(locale.Middleware(mux))),
	)
}

// registerRoutes registers every endpoint except /auth/* on mux, and
// returns the huma API (for tests, which read its OpenAPI document).
func registerRoutes(mux *http.ServeMux, s Services) huma.API {
	api := newHumaAPI(mux)
	registerMeRoutes(api, s.Queries)
	registerArticleRoutes(api, s.Articles)
	registerEventRoutes(api, s.Events)
	registerEventFeedRoutes(api, s.Events, s.Nollning)
	registerMemberRoutes(api, s.Members)
	registerCommitteeRoutes(api, s.Committees)
	registerAccessPolicyRoutes(api, s.AccessPolicies)
	registerNollningRoutes(api, s.Nollning)
	registerSongRoutes(api, s.Songs)
	registerSongBookRoutes(api, s.Songs)
	registerTicketRoutes(api, s.Tickets, s.TicketScheduler)
	registerAlertRoutes(api, s.Alerts)
	registerMarkdownRoutes(api, s.Markdown)
	registerGoverningDocumentRoutes(api, s.GoverningDocs)
	registerMedalRoutes(api, s.Medals)
	registerGalleryRoutes(api, s.Gallery)
	registerDocumentRoutes(api, s.Documents)
	registerDoorRoutes(api, s.Doors)
	registerBookingRoutes(api, s.Booking)
	registerElectionRoutes(api, s.Elections)
	registerCafeRoutes(api, s.Cafe)
	registerNotificationRoutes(api, s.Notifications)
	registerAdminSettingsRoutes(api, s.AdminSettings)
	registerLinksRoutes(api, s.Links)
	registerPingRoutes(api, s.Pings)
	registerReadmeRoutes(api, s.Readme)
	registerSearchRoutes(api, s.Search)

	// Plain handlers: their responses aren't JSON, or (Salto, the password
	// sync) they take a raw body. They're still behind the same middleware.
	// This exact path is polled by the university's own Salto door-lock
	// system, unauthenticated - see SaltoHandler's doc comment and
	// src/routes/(app)/salto/README.md ("this URL must not be changed").
	mux.HandleFunc("GET /salto/{door}", SaltoHandler(s.Doors))
	mux.HandleFunc(
		"POST /search/sync/password",
		SearchSyncPasswordHandler(s.Search, s.SyncPassword),
	)
	return api
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
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept-Language")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
