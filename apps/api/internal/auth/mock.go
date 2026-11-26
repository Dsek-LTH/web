package auth

import (
	"log/slog"
	"net/http"
)

// MockAuthenticator treats every request as authenticated as a single
// fixed Identity, regardless of any credentials (or lack thereof) on the
// request. It stands in for RealAuthenticator in local development
// (AUTH_MOCK=true) only. It is not a fallback for missing credentials on
// an otherwise-real authenticator.
//
// With anonymous set (NewCookieGatedMockAuthenticator), only a request
// carrying a session cookie is that Identity; one without is resolved by
// anonymous. The end-to-end tests run this way, so a server-side call
// that drops the browser's cookies is anonymous there too, as it would be
// with real auth, instead of passing unnoticed.
type MockAuthenticator struct {
	identity  *Identity
	anonymous Authenticator
}

// NewMockAuthenticator logs loudly on construction - this must never be
// wired up silently, including (especially) if this code is ever pointed
// at a real deployment before real auth exists.
func NewMockAuthenticator(identity *Identity) *MockAuthenticator {
	slog.Warn(
		"auth: MOCK authenticator active - every request is treated as authenticated as this member with all policies. This must never run against a real deployment.",
		"member_id",
		identity.MemberID,
		"student_id",
		identity.StudentID,
	)
	return &MockAuthenticator{identity: identity}
}

// NewCookieGatedMockAuthenticator is NewMockAuthenticator for requests
// with a SessionCookieName cookie (any value); requests without one go to
// anonymous.
func NewCookieGatedMockAuthenticator(
	identity *Identity,
	anonymous Authenticator,
) *MockAuthenticator {
	m := NewMockAuthenticator(identity)
	slog.Warn("auth: mock identity only for requests with a " + SessionCookieName + " cookie")
	m.anonymous = anonymous
	return m
}

func (m *MockAuthenticator) Authenticate(
	w http.ResponseWriter,
	r *http.Request,
) (*Identity, error) {
	if m.anonymous != nil {
		if _, err := r.Cookie(SessionCookieName); err != nil {
			return m.anonymous.Authenticate(w, r)
		}
	}
	return m.identity, nil
}
