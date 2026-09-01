package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/joho/godotenv"

	"github.com/dsek-lth/web/backend/internal/api"
	"github.com/dsek-lth/web/backend/internal/apinames"
	"github.com/dsek-lth/web/backend/internal/articles"
	"github.com/dsek-lth/web/backend/internal/auth"
	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/events"
	"github.com/dsek-lth/web/backend/internal/integrations"
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

	var authenticator auth.Authenticator
	var oidcClient *auth.OIDCClient
	if os.Getenv("AUTH_MOCK") == "true" {
		identity, err := mockIdentity(ctx, queries)
		if err != nil {
			log.Fatalf("resolve mock auth identity: %v", err)
		}
		authenticator = auth.NewMockAuthenticator(identity)
	} else {
		oidcClient, authenticator, err = newRealAuth(ctx, queries)
		if err != nil {
			log.Fatalf("set up real auth: %v", err)
		}
	}

	frontendOrigin := os.Getenv("PUBLIC_FRONTEND_URL")
	if frontendOrigin == "" {
		log.Fatal(
			"PUBLIC_FRONTEND_URL is not set - required for CORS now that requests carry credentials (see internal/api.withCORS)",
		)
	}

	articleSvc := articles.NewService(
		pool,
		integrations.MockScheduler{},
		integrations.MockNotifier{},
		integrations.MockWebhooker{},
		integrations.MockUploader{},
	)
	eventSvc := events.NewService(pool)
	router := api.NewRouter(
		articleSvc,
		eventSvc,
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
	)
	if err != nil {
		return nil, nil, fmt.Errorf("discover OIDC provider: %w", err)
	}

	return oidcClient, auth.NewRealAuthenticator(sessionCodec, oidcClient, queries), nil
}
