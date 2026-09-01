package auth

import (
	"crypto/sha256"
	"encoding/gob"
	"time"

	"github.com/gorilla/securecookie"
)

// SessionCookieName is the cookie both this API and SvelteKit (forwarding
// it to GET /me) read the session from.
const SessionCookieName = "dsek_session"

// SessionData is the payload SessionCookieName carries, encrypted and
// signed via SessionCodec so it's opaque and tamper-proof to the browser -
// mirrors the trust model Auth.js's own session cookie already used (see
// DESIGN.md's Auth section), just with no server-side session store:
// everything needed to resolve an Identity or silently refresh the access
// token lives in the cookie itself.
type SessionData struct {
	StudentID    string
	GroupList    []string
	RefreshToken string
	ExpiresAt    time.Time
}

func init() {
	gob.Register(SessionData{})
}

// SessionCodec encodes/decodes SessionData into the session cookie's value.
type SessionCodec struct {
	sc *securecookie.SecureCookie
}

// NewSessionCodec derives deterministic hash/block keys from secret (the
// existing AUTH_SECRET env var) via SHA-256, rather than generating random
// keys at startup - sessions must still decode after a restart, the same
// way Auth.js's AUTH_SECRET-derived session cookie already survives one.
// The cookie's own signature carries the default 30-day securecookie
// MaxAge as a hard cap independent of refresh-token validity.
func NewSessionCodec(secret string) *SessionCodec {
	hashKey := sha256.Sum256([]byte(secret + ":session-hash"))
	blockKey := sha256.Sum256([]byte(secret + ":session-block"))
	return &SessionCodec{sc: securecookie.New(hashKey[:], blockKey[:])}
}

func (c *SessionCodec) Encode(data SessionData) (string, error) {
	return c.sc.Encode(SessionCookieName, data)
}

func (c *SessionCodec) Decode(value string) (SessionData, error) {
	var data SessionData
	err := c.sc.Decode(SessionCookieName, value, &data)
	return data, err
}

// encodeNamed/decodeNamed reuse the same keys for cookies other than the
// session cookie (see oauthStateData in oidc.go) - securecookie binds the
// name into the MAC, so a different cookie name is enough to keep these
// independent despite sharing keys.
func (c *SessionCodec) encodeNamed(name string, v any) (string, error) {
	return c.sc.Encode(name, v)
}

func (c *SessionCodec) decodeNamed(name, value string, v any) error {
	return c.sc.Decode(name, value, v)
}
