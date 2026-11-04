package auth

import (
	"log"
	"net/http"
)

// MockAuthenticator treats every request as authenticated as a single
// fixed Identity, regardless of any credentials (or lack thereof) on the
// request. It stands in for RealAuthenticator in local development
// (AUTH_MOCK=true) only. It is not a fallback for missing credentials on
// an otherwise-real authenticator.
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
