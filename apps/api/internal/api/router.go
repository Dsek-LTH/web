// Package api wires the article/tag/upload endpoints through huma
// (github.com/danielgtaylor/huma/v2) on top of the stdlib net/http mux -
// see huma_articles.go.
package api

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"go.opentelemetry.io/otel/trace"

	"github.com/dsek-lth/web/apps/api/internal/accesspolicies"
	"github.com/dsek-lth/web/apps/api/internal/adminsettings"
	"github.com/dsek-lth/web/apps/api/internal/alerts"
	"github.com/dsek-lth/web/apps/api/internal/articles"
	"github.com/dsek-lth/web/apps/api/internal/auth"
	"github.com/dsek-lth/web/apps/api/internal/booking"
	"github.com/dsek-lth/web/apps/api/internal/cafe"
	"github.com/dsek-lth/web/apps/api/internal/committees"
	"github.com/dsek-lth/web/apps/api/internal/db"
	"github.com/dsek-lth/web/apps/api/internal/documents"
	"github.com/dsek-lth/web/apps/api/internal/doors"
	"github.com/dsek-lth/web/apps/api/internal/elections"
	"github.com/dsek-lth/web/apps/api/internal/events"
	"github.com/dsek-lth/web/apps/api/internal/gallery"
	"github.com/dsek-lth/web/apps/api/internal/governingdocs"
	"github.com/dsek-lth/web/apps/api/internal/links"
	"github.com/dsek-lth/web/apps/api/internal/locale"
	"github.com/dsek-lth/web/apps/api/internal/markdown"
	"github.com/dsek-lth/web/apps/api/internal/medals"
	"github.com/dsek-lth/web/apps/api/internal/members"
	"github.com/dsek-lth/web/apps/api/internal/nollning"
	"github.com/dsek-lth/web/apps/api/internal/notifications"
	"github.com/dsek-lth/web/apps/api/internal/pings"
	"github.com/dsek-lth/web/apps/api/internal/readme"
	"github.com/dsek-lth/web/apps/api/internal/search"
	"github.com/dsek-lth/web/apps/api/internal/songs"
	"github.com/dsek-lth/web/apps/api/internal/tickets"
	"github.com/dsek-lth/web/apps/api/internal/tracing"
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

// OpenAPI returns the API's OpenAPI document without any services, for
// cmd/openapi.
func OpenAPI() *huma.OpenAPI {
	return registerRoutes(http.NewServeMux(), Services{}).OpenAPI()
}

// NewRouter registers every endpoint. Every request is authenticated via
// authenticator before reaching a handler; handlers and Service methods
// read "who is doing this" from the request context (see internal/auth),
// never from the request body. oidcClient is nil when AUTH_MOCK is active
// (see cmd/api) - /auth/login, /auth/callback, /auth/logout are simply not
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

	return tracing.Handler(withLogging(
		withCORS(frontendOrigin)(
			auth.Middleware(authenticator)(withMemberLog(locale.Middleware(mux))),
		),
	))
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
	// apps/web/src/routes/(app)/salto/README.md ("this URL must not be changed").
	mux.HandleFunc("GET /salto/{door}", SaltoHandler(s.Doors))
	mux.HandleFunc(
		"POST /search/sync/password",
		SearchSyncPasswordHandler(s.Search, s.SyncPassword),
	)
	return api
}

// withLogging writes one log line per request: method, route, status,
// duration and (when signed in) the member. Inner handlers fill in what only
// they know - the route pattern (huma) and the member (after auth) - through
// the requestLog withLogging puts in the context.
func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		entry := &requestLog{}
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r.WithContext(context.WithValue(r.Context(), requestLogKey{}, entry)))

		route := entry.route
		if route == "" {
			route = r.URL.Path
		}
		attrs := []any{
			"method", r.Method,
			"route", route,
			"status", rec.status,
			"duration_ms", float64(time.Since(start).Microseconds()) / 1000,
		}
		if entry.memberID != "" {
			attrs = append(attrs, "member_id", entry.memberID)
		}
		if sc := trace.SpanContextFromContext(r.Context()); sc.IsValid() {
			attrs = append(attrs, "trace_id", sc.TraceID().String())
		}
		level := slog.LevelInfo
		if rec.status >= 500 {
			level = slog.LevelError
		}
		slog.Log(r.Context(), level, "request", attrs...)
	})
}

type requestLogKey struct{}

// requestLog collects what withLogging reports about a request.
type requestLog struct {
	route    string
	memberID string
}

func requestLogFrom(ctx context.Context) *requestLog {
	entry, _ := ctx.Value(requestLogKey{}).(*requestLog)
	return entry
}

// withMemberLog records the signed-in member for the request log; it runs
// right after auth.Middleware has resolved the identity.
func withMemberLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if entry := requestLogFrom(r.Context()); entry != nil {
			if identity, ok := auth.FromContext(r.Context()); ok {
				entry.memberID = identity.MemberID
			}
		}
		next.ServeHTTP(w, r)
	})
}

// statusRecorder remembers the status code a handler wrote.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

// Unwrap lets http.ResponseController reach the real writer (flushing).
func (s *statusRecorder) Unwrap() http.ResponseWriter { return s.ResponseWriter }

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
