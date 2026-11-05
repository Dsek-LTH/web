package api

// The authorization tests (authz_*_test.go) run the real router against a
// throwaway database: TestMain creates one next to POSTGRES_URL's (from the
// environment or backend/.env), migrates and seeds it, and drops it when the
// package's tests are done. Without a reachable Postgres they skip; the other
// tests in this package don't need one.

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"net/url"
	"os"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/dsek-lth/web/apps/backend/internal/accesspolicies"
	"github.com/dsek-lth/web/apps/backend/internal/adminsettings"
	"github.com/dsek-lth/web/apps/backend/internal/alerts"
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
	"github.com/dsek-lth/web/apps/backend/internal/markdown"
	"github.com/dsek-lth/web/apps/backend/internal/medals"
	"github.com/dsek-lth/web/apps/backend/internal/members"
	"github.com/dsek-lth/web/apps/backend/internal/nollning"
	"github.com/dsek-lth/web/apps/backend/internal/notifications"
	"github.com/dsek-lth/web/apps/backend/internal/pings"
	"github.com/dsek-lth/web/apps/backend/internal/readme"
	"github.com/dsek-lth/web/apps/backend/internal/search"
	"github.com/dsek-lth/web/apps/backend/internal/seed"
	"github.com/dsek-lth/web/apps/backend/internal/songs"
	"github.com/dsek-lth/web/apps/backend/internal/storage"
	"github.com/dsek-lth/web/apps/backend/internal/tickets"
)

// testEnv is the shared test server; nil when there's no database.
var testEnv *environment

type environment struct {
	pool    *pgxpool.Pool
	handler http.Handler
	// members are seeded members, in student id order: tests act as them.
	members []seededMember
}

type seededMember struct {
	ID        string
	StudentID string
}

func TestMain(m *testing.M) {
	cleanup, err := setUpDatabase()
	if err != nil {
		log.Printf("authorization tests will skip: %v", err)
	}
	// One request log line per test call would bury the test output.
	slog.SetDefault(slog.New(slog.DiscardHandler))
	code := m.Run()
	if cleanup != nil {
		cleanup()
	}
	os.Exit(code)
}

func setUpDatabase() (func(), error) {
	_ = godotenv.Load("../../.env")
	dsn := os.Getenv("POSTGRES_URL")
	if dsn == "" {
		return nil, fmt.Errorf("POSTGRES_URL is not set")
	}
	dsn, err := db.NormalizeDSN(dsn)
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	admin, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	if err := admin.Ping(ctx); err != nil {
		admin.Close()
		return nil, fmt.Errorf("database unreachable: %w", err)
	}
	suffix := make([]byte, 4)
	_, _ = rand.Read(suffix)
	name := "api_test_" + hex.EncodeToString(suffix)
	if _, err := admin.Exec(ctx, "CREATE DATABASE "+name); err != nil {
		admin.Close()
		return nil, fmt.Errorf("create test database: %w", err)
	}
	drop := func() {
		_, _ = admin.Exec(context.Background(), "DROP DATABASE IF EXISTS "+name+" WITH (FORCE)")
		admin.Close()
	}

	u, err := url.Parse(dsn)
	if err != nil {
		drop()
		return nil, err
	}
	u.Path = "/" + name
	testDSN := u.String()

	migrateDSN := *u
	q := migrateDSN.Query()
	if q.Get("sslmode") == "" {
		q.Set("sslmode", "prefer")
	}
	migrateDSN.RawQuery = q.Encode()
	mig, err := migrate.New("file://../db/migrations", migrateDSN.String())
	if err != nil {
		drop()
		return nil, fmt.Errorf("migrate: %w", err)
	}
	if err := mig.Up(); err != nil {
		mig.Close()
		drop()
		return nil, fmt.Errorf("migrate: %w", err)
	}
	mig.Close()

	pool, err := db.NewPool(ctx, testDSN)
	if err != nil {
		drop()
		return nil, err
	}
	if err := seed.Run(ctx, pool); err != nil {
		pool.Close()
		drop()
		return nil, fmt.Errorf("seed: %w", err)
	}

	env, err := newEnvironment(ctx, pool)
	if err != nil {
		pool.Close()
		drop()
		return nil, err
	}
	testEnv = env
	return func() {
		pool.Close()
		drop()
	}, nil
}

// fakeShlink answers like Shlink does without an API key, so link
// operations get past authorization and then fail upstream, as in local dev.
var fakeShlink = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(http.StatusUnauthorized)
	_, _ = w.Write([]byte(`{"type":"https://shlink.io/api/error/invalid-api-key",` +
		`"title":"Invalid API key","detail":"Provide a valid API key","status":401}`))
}))

// newEnvironment builds every service the way cmd/server does, with storage and
// push mocked and no Meilisearch or Shlink.
func newEnvironment(ctx context.Context, pool *pgxpool.Pool) (*environment, error) {
	queries := db.New(pool)
	store := storage.MockBackend{}
	nollningSvc := nollning.NewService(pool)
	notificationSvc := notifications.NewService(pool, nollningSvc, true)
	notifier := notifications.NewRealNotifier(notificationSvc)
	ticketSvc := tickets.NewService(pool)
	services := Services{
		Articles: articles.NewService(
			pool, notifier, notifications.NewRealWebhooker(notificationSvc), store,
		),
		Events:          events.NewService(pool, notifier),
		Members:         members.NewService(pool, store, "members"),
		Committees:      committees.NewService(pool, nollningSvc),
		AccessPolicies:  accesspolicies.NewService(pool),
		Nollning:        nollningSvc,
		Songs:           songs.NewService(pool),
		Alerts:          alerts.NewService(pool),
		Markdown:        markdown.NewService(pool),
		GoverningDocs:   governingdocs.NewService(pool),
		Medals:          medals.NewService(pool),
		Gallery:         gallery.NewService(store, nollningSvc, "albums"),
		Documents:       documents.NewService(store, "documents", "files"),
		Doors:           doors.NewService(pool),
		Booking:         booking.NewService(pool, notifier),
		Elections:       elections.NewService(pool),
		Cafe:            cafe.NewService(pool),
		Notifications:   notificationSvc,
		AdminSettings:   adminsettings.NewService(pool),
		Links:           links.NewService(fakeShlink.URL, ""),
		Pings:           pings.NewService(pool, notifier),
		Readme:          readme.NewService(pool),
		Tickets:         ticketSvc,
		TicketScheduler: tickets.NewScheduler(ticketSvc),
		Search:          search.NewService(pool, store, search.Config{DocumentBucket: "documents"}),
		Queries:         queries,
		SyncPassword:    "test-sync-password",
	}

	rows, err := pool.Query(
		ctx,
		`SELECT id::text, student_id FROM members WHERE student_id IS NOT NULL ORDER BY student_id LIMIT 6`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var seeded []seededMember
	for rows.Next() {
		var m seededMember
		if err := rows.Scan(&m.ID, &m.StudentID); err != nil {
			return nil, err
		}
		seeded = append(seeded, m)
	}
	if len(seeded) < 6 {
		return nil, fmt.Errorf("the seed made %d members, tests need 6", len(seeded))
	}
	return &environment{
		pool:    pool,
		handler: NewRouter(services, testAuthenticator{}, nil, "http://localhost:5173"),
		members: seeded,
	}, nil
}

// requireDB skips a test that needs the test database when there is none.
func requireDB(t *testing.T) *environment {
	t.Helper()
	if testEnv == nil {
		t.Skip("no test database (needs a reachable POSTGRES_URL)")
	}
	return testEnv
}

// caller is who a test request is made as.
type caller struct {
	label    string
	identity *auth.Identity
}

// testAuthenticator takes the identity from the request's context-free
// header, so each request picks its own caller.
type testAuthenticator struct{}

const identityHeader = "X-Test-Identity"

func (testAuthenticator) Authenticate(
	_ http.ResponseWriter,
	r *http.Request,
) (*auth.Identity, error) {
	raw := r.Header.Get(identityHeader)
	if raw == "" {
		return anonymousIdentity(), nil
	}
	var id auth.Identity
	if err := json.Unmarshal([]byte(raw), &id); err != nil {
		return nil, err
	}
	return &id, nil
}

func anonymousIdentity() *auth.Identity {
	return &auth.Identity{Roles: []string{"*"}}
}

var anonymous = caller{label: "anonymous", identity: anonymousIdentity()}

// as is seeded member n (0-5) holding exactly the given policies.
func (e *environment) as(n int, policies ...string) caller {
	m := e.members[n]
	label := fmt.Sprintf("member %d", n)
	if len(policies) > 0 {
		label += " with " + strings.Join(policies, ", ")
	}
	return caller{
		label: label,
		identity: &auth.Identity{
			MemberID:  m.ID,
			StudentID: m.StudentID,
			Policies:  slices.Clone(policies),
			Roles:     []string{"*", "_"},
		},
	}
}

// admin is seeded member 5 with every policy, for setting things up.
func (e *environment) admin() caller {
	c := e.as(5, apinames.All()...)
	c.label = "admin"
	return c
}

type response struct {
	status int
	body   []byte
}

func (r response) decode(t *testing.T, v any) {
	t.Helper()
	if err := json.Unmarshal(r.body, v); err != nil {
		t.Fatalf("decode %s: %v", r.body, err)
	}
}

// call makes one request as c; body is JSON-encoded unless it's nil.
func (e *environment) call(t *testing.T, c caller, method, path string, body any) response {
	t.Helper()
	var reader io.Reader
	contentType := ""
	switch b := body.(type) {
	case nil:
	case form:
		data, ct := b.encode(t)
		reader, contentType = bytes.NewReader(data), ct
	default:
		data, err := json.Marshal(b)
		if err != nil {
			t.Fatal(err)
		}
		reader, contentType = bytes.NewReader(data), "application/json"
	}
	req := httptest.NewRequest(method, path, reader)
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	if c.identity.MemberID != "" || len(c.identity.Policies) > 0 {
		raw, err := json.Marshal(c.identity)
		if err != nil {
			t.Fatal(err)
		}
		req.Header.Set(identityHeader, string(raw))
	}
	rec := httptest.NewRecorder()
	e.handler.ServeHTTP(rec, req)
	return response{status: rec.Code, body: rec.Body.Bytes()}
}

// form is a multipart body: fields, and files by field name (several
// files under one name for a multi-file field).
type form struct {
	fields map[string]string
	files  map[string][]formFile
}

type formFile struct {
	name string
	data []byte
}

// pngFile is a valid 1x1 PNG.
var pngFile = formFile{name: "pixel.png", data: []byte{
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
	0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
	0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0xf0,
	0x1f, 0x00, 0x05, 0x00, 0x01, 0xff, 0x89, 0x99, 0x3d, 0x1d, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
	0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
}}

func (f form) encode(t *testing.T) ([]byte, string) {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	for k, v := range f.fields {
		if err := w.WriteField(k, v); err != nil {
			t.Fatal(err)
		}
	}
	for field, files := range f.files {
		for _, file := range files {
			h := make(textproto.MIMEHeader)
			h.Set("Content-Disposition",
				fmt.Sprintf(`form-data; name="%s"; filename="%s"`, field, file.name))
			h.Set("Content-Type", http.DetectContentType(file.data))
			part, err := w.CreatePart(h)
			if err != nil {
				t.Fatal(err)
			}
			if _, err := part.Write(file.data); err != nil {
				t.Fatal(err)
			}
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return buf.Bytes(), w.FormDataContentType()
}

// one returns the single text value of query (setup data from the seed).
func (e *environment) one(t *testing.T, query string, args ...any) string {
	t.Helper()
	var v string
	if err := e.pool.QueryRow(context.Background(), query, args...).Scan(&v); err != nil {
		t.Fatalf("%s: %v", query, err)
	}
	return v
}

// idOf decodes the "id" (or key) field of a JSON response.
func idOf(t *testing.T, r response, key string) string {
	t.Helper()
	var m map[string]any
	r.decode(t, &m)
	v, isString := m[key].(string)
	if !isString {
		t.Fatalf("response has no string %q: %s", key, truncate(r.body))
	}
	return v
}

// mustCall is call for setup steps that have to succeed.
func (e *environment) mustCall(t *testing.T, c caller, method, path string, body any) response {
	t.Helper()
	res := e.call(t, c, method, path, body)
	if res.status >= 300 {
		t.Fatalf("setup %s %s as %s: %d %s", method, path, c.label, res.status, res.body)
	}
	return res
}

// outcome is what a case expects.
type outcome int

const (
	// ok: a 2xx.
	ok outcome = iota
	// denied: 401 or 403.
	denied
	// allowed: past the authorization check - anything but 401, 403 and
	// 5xx. For operations whose external service (MinIO, Shlink,
	// Meilisearch) is mocked or missing here, so their result can't be a
	// plain success.
	allowed
	// hidden: 404, for things a caller may not even know exist.
	hidden
	// unavailable: 503, past the authorization check of an operation whose
	// service (Meilisearch) isn't configured here.
	unavailable
)

func (o outcome) String() string {
	return [...]string{"2xx", "401/403", "not 401/403/5xx", "404", "503"}[o]
}

func (o outcome) matches(status int) bool {
	switch o {
	case ok:
		return status >= 200 && status < 300
	case denied:
		return status == http.StatusUnauthorized || status == http.StatusForbidden
	case allowed:
		return status != http.StatusUnauthorized && status != http.StatusForbidden && status < 500
	case hidden:
		return status == http.StatusNotFound
	case unavailable:
		return status == http.StatusServiceUnavailable
	}
	return false
}

// accessCase is one request and what it should get.
type accessCase struct {
	as     caller
	method string
	path   string
	body   any
	want   outcome
}

// check runs cases in order (later ones may rely on earlier ones' effects).
func (e *environment) check(t *testing.T, cases []accessCase) {
	t.Helper()
	for _, c := range cases {
		res := e.call(t, c.as, c.method, c.path, c.body)
		if !c.want.matches(res.status) {
			t.Errorf("%s %s as %s: got %d, want %s: %s",
				c.method, c.path, c.as.label, res.status, c.want, truncate(res.body))
		}
	}
}

func truncate(b []byte) string {
	if len(b) > 300 {
		return string(b[:300]) + "..."
	}
	return string(b)
}

// gate is the usual shape for an operation behind one policy: denied to an
// anonymous caller and to a member without it, then run by a member with
// it (the last case, so setup that needs the change can follow).
func (e *environment) gate(
	method, path string,
	body any,
	want outcome,
	policies ...string,
) []accessCase {
	return []accessCase{
		{as: anonymous, method: method, path: path, body: body, want: denied},
		{as: e.as(1), method: method, path: path, body: body, want: denied},
		{as: e.as(1, policies...), method: method, path: path, body: body, want: want},
	}
}
