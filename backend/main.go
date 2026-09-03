package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/joho/godotenv"

	"github.com/dsek-lth/web/backend/internal/accesspolicies"
	"github.com/dsek-lth/web/backend/internal/adminsettings"
	"github.com/dsek-lth/web/backend/internal/alerts"
	"github.com/dsek-lth/web/backend/internal/api"
	"github.com/dsek-lth/web/backend/internal/apinames"
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
	"github.com/dsek-lth/web/backend/internal/integrations"
	"github.com/dsek-lth/web/backend/internal/links"
	"github.com/dsek-lth/web/backend/internal/markdown"
	"github.com/dsek-lth/web/backend/internal/medals"
	"github.com/dsek-lth/web/backend/internal/members"
	"github.com/dsek-lth/web/backend/internal/nollning"
	"github.com/dsek-lth/web/backend/internal/notifications"
	"github.com/dsek-lth/web/backend/internal/songs"
	"github.com/dsek-lth/web/backend/internal/stocklist"
	"github.com/dsek-lth/web/backend/internal/storage"
)

func main() {
	// Best-effort: a local backend/.env, falling back to the SvelteKit
	// app's .env one level up so both backends can share dev credentials.
	// godotenv.Load errors out on the first missing file rather than
	// trying the next, so each candidate is loaded individually.
	if err := godotenv.Load(".env"); err != nil {
		_ = godotenv.Load("../.env")
	}

	dsn := os.Getenv("POSTGRES_URL")
	if dsn == "" {
		log.Fatal("POSTGRES_URL is not set")
	}

	ctx := context.Background()

	pool, err := db.NewPool(ctx, dsn)
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer pool.Close()

	log.Println("connected to database")

	queries := db.New(pool)
	nollningSvc := nollning.NewService(pool)

	// PUSH_MOCK gates only the real Expo network call (in-app Notification
	// rows are always created for real) - default true (mock/no-op) unless
	// explicitly set to "false", same "explicit opt-in to real, loud either
	// way" shape as AUTH_MOCK/STORAGE_MOCK. This should stay true for any
	// non-production environment sharing the live dev DB's real device
	// tokens - see DESIGN.md's Phase 9 entry.
	pushMock := os.Getenv("PUSH_MOCK") != "false"
	if pushMock {
		log.Println(
			"PUSH_MOCK is not \"false\" - push notifications will be logged, not sent for real via Expo. Set PUSH_MOCK=false to send real pushes.",
		)
	}
	notificationSvc := notifications.NewService(pool, nollningSvc, pushMock)

	frontendOrigin := os.Getenv("PUBLIC_FRONTEND_URL")
	if frontendOrigin == "" {
		log.Fatal(
			"PUBLIC_FRONTEND_URL is not set - required for CORS now that requests carry credentials (see internal/api.withCORS)",
		)
	}
	// Go has no built-in dev/prod distinction the way e.g. Node has
	// NODE_ENV - this is the closest free signal available: a real
	// deployment MUST set PUBLIC_FRONTEND_URL to its real origin for
	// login redirects/CORS to work at all (see internal/api.withCORS), so
	// it can't accidentally still say "localhost" there the way an
	// inherited AUTH_MOCK=true from the shared, git-tracked ../.env could
	// accidentally still say "true" - see DESIGN.md's Auth section for
	// the AUTH_MOCK-defaults-on-in-.env decision this backstops.
	frontendURL, err := url.Parse(frontendOrigin)
	if err != nil {
		log.Fatalf("PUBLIC_FRONTEND_URL is not a valid URL: %v", err)
	}
	looksLikeLocalDev := frontendURL.Hostname() == "localhost" ||
		frontendURL.Hostname() == "127.0.0.1"

	var authenticator auth.Authenticator
	var oidcClient *auth.OIDCClient
	if os.Getenv("AUTH_MOCK") == "true" {
		if !looksLikeLocalDev {
			log.Fatalf(
				"AUTH_MOCK=true but PUBLIC_FRONTEND_URL (%q) doesn't look like a local dev address (localhost/127.0.0.1) - refusing to start with mock auth against what looks like a real deployment. Set AUTH_MOCK=false (or unset it) for a real deployment.",
				frontendOrigin,
			)
		}
		identity, err := mockIdentity(ctx, queries)
		if err != nil {
			log.Fatalf("resolve mock auth identity: %v", err)
		}
		authenticator = auth.NewMockAuthenticator(identity)
	} else {
		oidcClient, authenticator, err = newRealAuth(ctx, queries, nollningSvc, notificationSvc)
		if err != nil {
			log.Fatalf("set up real auth: %v", err)
		}
	}

	var store storage.Backend
	if os.Getenv("STORAGE_MOCK") == "true" {
		log.Println(
			"STORAGE_MOCK=true - using a no-op mock store; gallery/documents/article-image-upload will not actually store anything. This must never run against a real deployment.",
		)
		store = storage.MockBackend{}
	} else {
		store, err = newStorage()
		if err != nil {
			log.Fatalf(
				"set up file storage (or set STORAGE_MOCK=true for local dev without MinIO): %v",
				err,
			)
		}
	}

	realNotifier := notifications.NewRealNotifier(notificationSvc)
	articleSvc := articles.NewService(
		pool,
		integrations.MockScheduler{},
		realNotifier,
		notifications.NewRealWebhooker(notificationSvc),
		store,
	)
	eventSvc := events.NewService(pool, realNotifier)
	memberSvc := members.NewService(pool)
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
	stocklistSvc := stocklist.NewService(pool)
	linksSvc := links.NewService(os.Getenv("SHLINK_ENDPOINT"), os.Getenv("SHLINK_API_KEY"))
	router := api.NewRouter(
		articleSvc,
		eventSvc,
		memberSvc,
		committeeSvc,
		accessPolicySvc,
		nollningSvc,
		songSvc,
		alertSvc,
		markdownSvc,
		governingDocSvc,
		medalSvc,
		gallerySvc,
		documentSvc,
		doorSvc,
		bookingSvc,
		electionSvc,
		cafeSvc,
		notificationSvc,
		adminSettingsSvc,
		stocklistSvc,
		linksSvc,
		authenticator,
		oidcClient,
		queries,
		frontendOrigin,
	)

	addr := os.Getenv("ADDR")
	if addr == "" {
		// Not :8080 - the SvelteKit app's scheduler-service already claims
		// that port in local dev (see SCHEDULER_ENDPOINT in ../.env).
		addr = ":8090"
	}

	log.Printf("listening on %s", addr)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("serve: %v", err)
	}
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
// (AUTH_MOCK unset or not "true") per DESIGN.md's Auth section: the mock
// must be an explicit opt-in, never a silent fallback for missing config.
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
		log.Fatalf("%s must be set", name)
	}
	return value
}

// newStorage builds the real MinIO-backed Store (see internal/storage and
// ../../DESIGN.md's Phase 4 section) - the default unless STORAGE_MOCK=true
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
