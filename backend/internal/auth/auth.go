// Package auth is the authorization boundary for this API: an Identity
// resolved per-request, carried in context, and checked against policy
// strings (see internal/apinames). There is currently only a mock
// Authenticator (see mock.go) - see ../../DESIGN.md's Auth section for why
// that's intentional rather than a shortcut, and what a real
// implementation needs to slot in behind this same interface.
package auth

import (
	"context"
	"errors"
	"net/http"
)

// Identity is who a request is acting as: a member id, their student id
// (kept mainly for logging/debugging), the policy strings they hold, and
// the derived roles those policies came from (see DerivedRoles). Roles is
// exposed (via GET /me) because some SvelteKit features - the shop's
// shoppableAccessPolicyFilter - filter directly on role, not just resolved
// policy strings, mirroring src/database/schema.zmodel's own User.roles.
type Identity struct {
	MemberID  string
	StudentID string
	Policies  []string
	Roles     []string
}

func (i *Identity) Has(policy string) bool {
	for _, p := range i.Policies {
		if p == policy {
			return true
		}
	}
	return false
}

var (
	// ErrUnauthenticated means the request has no identity at all.
	ErrUnauthenticated = errors.New("auth: unauthenticated")
	// ErrForbidden means there's an identity, but it lacks the required policy.
	ErrForbidden = errors.New("auth: forbidden")
)

type ctxKey struct{}

func withIdentity(ctx context.Context, id *Identity) context.Context {
	return context.WithValue(ctx, ctxKey{}, id)
}

// FromContext returns the request's Identity, as attached by Middleware.
func FromContext(ctx context.Context) (*Identity, bool) {
	id, ok := ctx.Value(ctxKey{}).(*Identity)
	return id, ok
}

// Require returns ErrUnauthenticated if ctx has no Identity, or
// ErrForbidden if it has one that lacks policy. Callers (typically
// internal/articles service methods) should map these to 401/403 the same
// way internal/api already maps articles.ErrNotFound etc.
func Require(ctx context.Context, policy string) error {
	id, ok := FromContext(ctx)
	if !ok {
		return ErrUnauthenticated
	}
	if !id.Has(policy) {
		return ErrForbidden
	}
	return nil
}

// Authenticator resolves a request to an Identity. w is passed through so a
// real implementation can rewrite the session cookie mid-request (e.g.
// RealAuthenticator re-issuing it after a silent token refresh) without
// every caller needing its own cookie-mutation path. MockAuthenticator
// ignores it. A request with no credentials at all is not an error here -
// RealAuthenticator resolves it to an anonymous Identity (public GETs must
// keep working logged-out) - Authenticate only errors for a request that
// actively can't be resolved.
type Authenticator interface {
	Authenticate(w http.ResponseWriter, r *http.Request) (*Identity, error)
}

// Middleware resolves an Identity for every request via a and attaches it
// to the request context.
func Middleware(a Authenticator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			id, err := a.Authenticate(w, r)
			if err != nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r.WithContext(withIdentity(r.Context(), id)))
		})
	}
}
