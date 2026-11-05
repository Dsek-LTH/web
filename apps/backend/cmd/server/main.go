package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/joho/godotenv"

	"github.com/dsek-lth/web/apps/backend/internal/accesspolicies"
	"github.com/dsek-lth/web/apps/backend/internal/adminsettings"
	"github.com/dsek-lth/web/apps/backend/internal/alerts"
	"github.com/dsek-lth/web/apps/backend/internal/api"
	"github.com/dsek-lth/web/apps/backend/internal/apinames"
	"github.com/dsek-lth/web/apps/backend/internal/articles"
	"github.com/dsek-lth/web/apps/backend/internal/auth"
	"github.com/dsek-lth/web/apps/backend/internal/booking"
	"github.com/dsek-lth/web/apps/backend/internal/cafe"
	"github.com/dsek-lth/web/apps/backend/internal/committees"
	"github.com/dsek-lth/web/apps/backend/internal/db"
	"github.com/dsek-lth/web/apps/backend/internal/documents"
	"github.com/dsek-lth/web/apps/backend/internal/doors"
	"github.com/dsek-lth/web/apps/backend/internal/elections"
	"github.com/dsek-lth/web/apps/backend/internal/events"
	"github.com/dsek-lth/web/apps/backend/internal/gallery"
	"github.com/dsek-lth/web/apps/backend/internal/governingdocs"
	"github.com/dsek-lth/web/apps/backend/internal/links"
	"github.com/dsek-lth/web/apps/backend/internal/logging"
	"github.com/dsek-lth/web/apps/backend/internal/markdown"
	"github.com/dsek-lth/web/apps/backend/internal/medals"
	"github.com/dsek-lth/web/apps/backend/internal/members"
	"github.com/dsek-lth/web/apps/backend/internal/nollning"
	"github.com/dsek-lth/web/apps/backend/internal/notifications"
	"github.com/dsek-lth/web/apps/backend/internal/pings"
	"github.com/dsek-lth/web/apps/backend/internal/readme"
	"github.com/dsek-lth/web/apps/backend/internal/search"
	"github.com/dsek-lth/web/apps/backend/internal/songs"
	"github.com/dsek-lth/web/apps/backend/internal/storage"
	"github.com/dsek-lth/web/apps/backend/internal/tickets"
	"github.com/dsek-lth/web/apps/backend/internal/tracing"
)

func main() {
	// Best-effort: the tracked dev settings in backend/.env. Variables
	// already set in the environment win.
	_ = godotenv.Load(".env")
	logging.Setup()
	flushTraces := tracing.Setup(context.Background())

	dsn := os.Getenv("POSTGRES_URL")
	if dsn == "" {
		logging.Fatal("POSTGRES_URL is not set")
	}

	ctx := context.Background()

	pool, err := db.NewPool(ctx, dsn)
	if err != nil {
		logging.Fatal("connect to database", "err", err)
	}
	defer pool.Close()

	slog.Info("connected to database")

	queries := db.New(pool)
	nollningSvc := nollning.NewService(pool)

	// PUSH_MOCK gates only the real Expo network call (in-app Notification
	// rows are always created for real) - default true (mock/no-op) unless
	// explicitly set to "false", same "explicit opt-in to real, loud either
	// way" shape as AUTH_MOCK/STORAGE_MOCK. This should stay true for any
	// non-production environment that may hold real device tokens.
	pushMock := os.Getenv("PUSH_MOCK") != "false"
	if pushMock {
		slog.Info(
			"PUSH_MOCK is not \"false\": push notifications are logged, not sent through Expo",
		)
	}
	notificationSvc := notifications.NewService(pool, nollningSvc, pushMock)

	frontendOrigin := os.Getenv("PUBLIC_FRONTEND_URL")
	if frontendOrigin == "" {
		logging.Fatal(
			"PUBLIC_FRONTEND_URL is not set - required for CORS now that requests carry credentials (see internal/api.withCORS)",
		)
	}
	// Go has no built-in dev/prod distinction the way e.g. Node has
	// NODE_ENV - this is the closest free signal available: a real
	// deployment MUST set PUBLIC_FRONTEND_URL to its real origin for
	// login redirects/CORS to work at all (see internal/api.withCORS), so
	// it can't accidentally still say "localhost" there the way an
	// inherited AUTH_MOCK=true from the git-tracked .env could
	// accidentally still say "true".
	frontendURL, err := url.Parse(frontendOrigin)
	if err != nil {
		logging.Fatal("PUBLIC_FRONTEND_URL is not a valid URL", "err", err)
	}
	looksLikeLocalDev := frontendURL.Hostname() == "localhost" ||
		frontendURL.Hostname() == "127.0.0.1"

	var authenticator auth.Authenticator
	var oidcClient *auth.OIDCClient
	if os.Getenv("AUTH_MOCK") == "true" {
		if !looksLikeLocalDev {
			logging.Fatal(
				"AUTH_MOCK=true but PUBLIC_FRONTEND_URL doesn't look like a local dev address (localhost/127.0.0.1) - refusing to start with mock auth against what looks like a real deployment. Set AUTH_MOCK=false (or unset it) for a real deployment.",
				"frontend",
				frontendOrigin,
			)
		}
		identity, err := mockIdentity(ctx, queries)
		if err != nil {
			logging.Fatal("resolve mock auth identity", "err", err)
		}
		authenticator = auth.NewMockAuthenticator(identity)
	} else {
		oidcClient, authenticator, err = newRealAuth(ctx, queries, nollningSvc, notificationSvc)
		if err != nil {
			logging.Fatal("set up real auth", "err", err)
		}
	}

	var store storage.Backend
	if os.Getenv("STORAGE_MOCK") == "true" {
		slog.Warn(
			"STORAGE_MOCK=true: using a no-op mock store, nothing is actually stored. This must never run against a real deployment.",
		)
		store = storage.MockBackend{}
	} else {
		store, err = newStorage()
		if err != nil {
			logging.Fatal(
				"set up file storage (or set STORAGE_MOCK=true for local dev without MinIO)",
				"err", err,
			)
		}
	}

	realNotifier := notifications.NewRealNotifier(notificationSvc)
	articleSvc := articles.NewService(
		pool,
		realNotifier,
		notifications.NewRealWebhooker(notificationSvc),
		store,
	)
	// Announces articles as they go live (future-dated ones included) -
	// replaces the external scheduler-service.
	go articleSvc.RunAnnouncementLoop(context.Background(), time.Minute)
	eventSvc := events.NewService(pool, realNotifier)
	memberSvc := members.NewService(pool, store, mustEnv("PUBLIC_BUCKETS_MEMBERS"))
	committeeSvc := committees.NewService(pool, nollningSvc)
	accessPolicySvc := accesspolicies.NewService(pool)
	songSvc := songs.NewService(pool)
	alertSvc := alerts.NewService(pool)
	markdownSvc := markdown.NewService(pool)
	governingDocSvc := governingdocs.NewService(pool)
	medalSvc := medals.NewService(pool)
	gallerySvc := gallery.NewService(store, nollningSvc, mustEnv("PUBLIC_BUCKETS_ALBUMS"))
	documentSvc := documents.NewService(
		store,
		mustEnv("PUBLIC_BUCKETS_DOCUMENTS"),
		mustEnv("PUBLIC_BUCKETS_FILES"),
	)
	bookingSvc := booking.NewService(pool, realNotifier)
	electionSvc := elections.NewService(pool)
	cafeSvc := cafe.NewService(pool)
	doorSvc := doors.NewService(pool)
	adminSettingsSvc := adminsettings.NewService(pool)
	linksSvc := links.NewService(os.Getenv("SHLINK_ENDPOINT"), os.Getenv("SHLINK_API_KEY"))
	pingSvc := pings.NewService(pool, realNotifier)
	readmeSvc := readme.NewService(pool)

	// Ticket releases' lottery and offer-expiry sweeps run in-process (see
	// internal/tickets' Scheduler): lottery timers don't survive a restart,
	// so they're re-armed from the database here.
	ticketSvc := tickets.NewService(pool)
	ticketScheduler := tickets.NewScheduler(ticketSvc)
	if err := ticketScheduler.RestoreOnStartup(context.Background()); err != nil {
		logging.Fatal("restore ticket lotteries", "err", err)
	}
	go ticketScheduler.RunSweepLoop(context.Background(), 15*time.Second)

	// Search runs on Meilisearch; without MEILISEARCH_HOST every search
	// call answers 503 rather than the backend refusing to start.
	meiliHost := os.Getenv("MEILISEARCH_HOST")
	if meiliHost == "" {
		slog.Warn("MEILISEARCH_HOST is not set - search is disabled")
	}
	searchSvc := search.NewService(pool, store, search.Config{
		MeiliHost:      meiliHost,
		MeiliAPIKey:    os.Getenv("MEILISEARCH_MASTER_KEY"),
		PopplerURL:     os.Getenv("POPPLER_SERVER_URL"),
		DocumentBucket: mustEnv("PUBLIC_BUCKETS_DOCUMENTS"),
	})

	router := api.NewRouter(
		api.Services{
			Articles:        articleSvc,
			Events:          eventSvc,
			Members:         memberSvc,
			Committees:      committeeSvc,
			AccessPolicies:  accessPolicySvc,
			Nollning:        nollningSvc,
			Songs:           songSvc,
			Alerts:          alertSvc,
			Markdown:        markdownSvc,
			GoverningDocs:   governingDocSvc,
			Medals:          medalSvc,
			Gallery:         gallerySvc,
			Documents:       documentSvc,
			Doors:           doorSvc,
			Booking:         bookingSvc,
			Elections:       electionSvc,
			Cafe:            cafeSvc,
			Notifications:   notificationSvc,
			AdminSettings:   adminSettingsSvc,
			Links:           linksSvc,
			Pings:           pingSvc,
			Readme:          readmeSvc,
			Tickets:         ticketSvc,
			TicketScheduler: ticketScheduler,
			Search:          searchSvc,
			Queries:         queries,
			SyncPassword:    os.Getenv("SYNC_PASSWORD"),
		},
		authenticator,
		oidcClient,
		frontendOrigin,
	)

	addr := os.Getenv("ADDR")
	if addr == "" {
		// Not :8080, which the old scheduler-service used to claim in local
		// dev.
		addr = ":8090"
	}

	// Stop on SIGTERM (every deploy) by finishing the requests in flight,
	// then flushing traces.
	server := &http.Server{Addr: addr, Handler: router}
	stopping, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		<-stopping.Done()
		slog.Info("shutting down")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			slog.Error("shut down server", "err", err)
		}
	}()

	slog.Info("listening", "addr", addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logging.Fatal("serve", "err", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	flushTraces(ctx)
}

// mockIdentity resolves the single Identity every request is treated as
// (see internal/auth.MockAuthenticator). AUTH_MOCK_STUDENT_ID picks a
// specific member for dev testing; otherwise an arbitrary real member is
// used so foreign keys on things like authors.member_id are always valid.
func mockIdentity(ctx context.Context, queries *db.Queries) (*auth.Identity, error) {
	if studentID := os.Getenv("AUTH_MOCK_STUDENT_ID"); studentID != "" {
		row, err := queries.GetMemberByStudentID(ctx, pgtype.Text{String: studentID, Valid: true})
		if err != nil {
			return nil, err
		}
		return &auth.Identity{
			MemberID:  uuid.UUID(row.ID.Bytes).String(),
			StudentID: studentID,
			Policies:  apinames.All(),
		}, nil
	}

	row, err := queries.GetAnyMember(ctx)
	if err != nil {
		return nil, err
	}
	return &auth.Identity{
		MemberID:  uuid.UUID(row.ID.Bytes).String(),
		StudentID: row.StudentID.String,
		Policies:  apinames.All(),
	}, nil
}

// newRealAuth builds the OIDC client and RealAuthenticator - the default
// (AUTH_MOCK unset or not "true"): the mock must be an explicit opt-in, never a silent fallback for missing config.
func newRealAuth(
	ctx context.Context,
	queries *db.Queries,
	nollningSvc auth.StabenInjector,
	seeder auth.MemberSeeder,
) (*auth.OIDCClient, auth.Authenticator, error) {
	required := []struct{ name, value string }{
		{"AUTH_SECRET", os.Getenv("AUTH_SECRET")},
		{"PUBLIC_AUTH_AUTHENTIK_ISSUER", os.Getenv("PUBLIC_AUTH_AUTHENTIK_ISSUER")},
		{"AUTH_AUTHENTIK_CLIENT_ID", os.Getenv("AUTH_AUTHENTIK_CLIENT_ID")},
		{"PUBLIC_GO_BACKEND_URL", os.Getenv("PUBLIC_GO_BACKEND_URL")},
		{"PUBLIC_FRONTEND_URL", os.Getenv("PUBLIC_FRONTEND_URL")},
	}
	for _, r := range required {
		if r.value == "" {
			return nil, nil, fmt.Errorf(
				"%s must be set (or set AUTH_MOCK=true for mock auth)",
				r.name,
			)
		}
	}
	issuer := required[1].value
	sessionCodec := auth.NewSessionCodec(required[0].value)

	// Empty for the dev provider (a public PKCE client - see .env's comment
	// on this var); a real deployment's confidential provider has one, which
	// switches NewOIDCClient onto HS256 verification (see its doc comment).
	clientSecret := os.Getenv("AUTH_AUTHENTIK_CLIENT_SECRET")

	oidcClient, err := auth.NewOIDCClient(
		ctx,
		issuer,
		required[2].value, // client ID
		clientSecret,
		required[3].value+"/auth/callback", // callback URL
		issuer+"end-session/",              // matches lib/utils/auth.ts's signOut() exactly
		required[4].value,                  // frontend URL, for post-login redirect
		sessionCodec,
		queries,
		seeder,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("discover OIDC provider: %w", err)
	}

	return oidcClient, auth.NewRealAuthenticator(
		sessionCodec,
		oidcClient,
		queries,
		nollningSvc,
	), nil
}

// mustEnv reads a required env var or fails fast - same "explicit opt-in,
// never a silent fallback" stance newRealAuth already takes for its own
// required vars.
func mustEnv(name string) string {
	value := os.Getenv(name)
	if value == "" {
		logging.Fatal(name + " must be set")
	}
	return value
}

// newStorage builds the real MinIO-backed Store (see internal/storage) -
// the default unless STORAGE_MOCK=true
// opts out for local dev without MinIO credentials configured, same
// "explicit opt-in, never a silent fallback" shape as AUTH_MOCK.
func newStorage() (*storage.Store, error) {
	port := mustEnv("MINIO_PORT")
	if _, err := strconv.Atoi(port); err != nil {
		return nil, fmt.Errorf("MINIO_PORT must be numeric, got %q", port)
	}
	endpoint := mustEnv("MINIO_ENDPOINT") + ":" + port

	return storage.New(storage.Config{
		Endpoint:           endpoint,
		UseSSL:             os.Getenv("MINIO_USE_SSL") == "true",
		AccessKey:          mustEnv("MINIO_ROOT_USER"),
		SecretKey:          mustEnv("MINIO_ROOT_PASSWORD"),
		BaseURL:            mustEnv("PUBLIC_MINIO_BASE_URL"),
		ArticleImageBucket: mustEnv("PUBLIC_BUCKETS_FILES"),
	})
}
