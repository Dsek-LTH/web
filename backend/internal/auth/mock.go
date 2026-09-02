package auth

import (
	"log"
	"net/http"
)

// MockAuthenticator treats every request as authenticated as a single
// fixed Identity, regardless of any credentials (or lack thereof) on the
// request. This stands in for real auth while the site is non-production
// for the duration of the rewrite - see ../../DESIGN.md's Auth section.
// It is not a fallback for missing credentials on an otherwise-real
// authenticator; it is the *only* authenticator right now.
type MockAuthenticator struct {
	identity *Identity
}

// NewMockAuthenticator logs loudly on construction - this must never be
// wired up silently, including (especially) if this code is ever pointed
// at a real deployment before real auth exists.
func NewMockAuthenticator(identity *Identity) *MockAuthenticator {
	log.Printf(
		"auth: MOCK authenticator active - every request is treated as authenticated as member %s (%s) with all policies. This must never run against a real deployment.",
		identity.MemberID,
		identity.StudentID,
	)
	return &MockAuthenticator{identity: identity}
}

func (m *MockAuthenticator) Authenticate(
	_ http.ResponseWriter,
	_ *http.Request,
) (*Identity, error) {
	return m.identity, nil
}
