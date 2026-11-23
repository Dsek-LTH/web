package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/dsek-lth/web/apps/api/internal/db"
)

// noMembersDB is a db.DBTX with no members and no access policies: every
// single-row query finds nothing and every list is empty.
type noMembersDB struct{}

func (noMembersDB) Exec(context.Context, string, ...any) (pgconn.CommandTag, error) {
	return pgconn.CommandTag{}, nil
}

func (noMembersDB) Query(context.Context, string, ...any) (pgx.Rows, error) {
	return emptyRows{}, nil
}

func (noMembersDB) QueryRow(context.Context, string, ...any) pgx.Row {
	return noRow{}
}

type noRow struct{}

func (noRow) Scan(...any) error { return pgx.ErrNoRows }

type emptyRows struct{}

func (emptyRows) Close()                                       {}
func (emptyRows) Err() error                                   { return nil }
func (emptyRows) CommandTag() pgconn.CommandTag                { return pgconn.CommandTag{} }
func (emptyRows) FieldDescriptions() []pgconn.FieldDescription { return nil }
func (emptyRows) Next() bool                                   { return false }
func (emptyRows) Scan(...any) error                            { return nil }
func (emptyRows) Values() ([]any, error)                       { return nil, nil }
func (emptyRows) RawValues() [][]byte                          { return nil }
func (emptyRows) Conn() *pgx.Conn                              { return nil }

type noSeason struct{}

func (noSeason) InjectStabenPolicy(_ context.Context, policies []string) ([]string, error) {
	return policies, nil
}

func (noSeason) NollaYear(context.Context) (int, error) { return 0, nil }

func TestSessionForMissingMemberIsAnonymous(t *testing.T) {
	codec := NewSessionCodec("test-secret")
	a := NewRealAuthenticator(codec, nil, db.New(noMembersDB{}), noSeason{})

	value, err := codec.Encode(SessionData{
		StudentID: "gone1234-s",
		ExpiresAt: time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatal(err)
	}
	r := httptest.NewRequest(http.MethodGet, "/me", nil)
	r.AddCookie(&http.Cookie{Name: SessionCookieName, Value: value})
	w := httptest.NewRecorder()

	id, err := a.Authenticate(w, r)
	if err != nil {
		t.Fatalf("Authenticate: %v, want an anonymous identity", err)
	}
	if id.MemberID != "" || id.StudentID != "" {
		t.Errorf("identity = %+v, want anonymous", id)
	}
	cleared := false
	for _, c := range w.Result().Cookies() {
		if c.Name == SessionCookieName && c.MaxAge < 0 {
			cleared = true
		}
	}
	if !cleared {
		t.Errorf("Set-Cookie = %q, want the session cookie cleared",
			strings.Join(w.Result().Header.Values("Set-Cookie"), "; "))
	}
}
