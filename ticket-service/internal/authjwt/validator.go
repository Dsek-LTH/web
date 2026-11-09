// Package authjwt validates the Authentik-issued OIDC id_token that
// SvelteKit's server code already extracts via getDecryptedJWT and forwards
// as a Bearer token - the same pattern scheduler-service's authMiddleware
// uses, reused here instead of decoding any session cookie format directly.
package authjwt

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/httprc/v3/tracesink"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

var ErrUnauthenticated = errors.New("missing or invalid bearer token")

// Identity is the member identified by a validated id_token.
type Identity struct {
	// MemberID is the Authentik "preferred_username" claim, which is what
	// the rest of this app calls a member's studentId.
	MemberID string
}

type Validator struct {
	issuer     string
	audience   string
	jwksURL    string
	jwksMu     chan struct{}

	// cachedJWKS is a live view of the jwk.Cache, which keeps re-fetching
	// the key set in the background so Authentik key rotations are picked
	// up. Guarded by cachedMu since it's set lazily on the first request.
	cachedMu   sync.RWMutex
	cachedJWKS jwk.Set
}

func NewValidator(issuer, audience, jwksURL string) *Validator {
	return &Validator{
		issuer:   issuer,
		audience: audience,
		jwksURL:  jwksURL,
		jwksMu:   make(chan struct{}, 1),
	}
}

// ValidateBearer parses and validates the raw "Authorization" header value
// (including the "Bearer " prefix) and returns the identified member.
func (v *Validator) ValidateBearer(ctx context.Context, header string) (Identity, error) {
	const bearerPrefix = "Bearer "
	if !strings.HasPrefix(header, bearerPrefix) {
		return Identity{}, ErrUnauthenticated
	}
	raw := strings.TrimPrefix(header, bearerPrefix)
	if raw == "" {
		return Identity{}, ErrUnauthenticated
	}

	keySet := v.loadJWKS()
	if keySet == nil {
		var err error
		if keySet, err = v.initJWKS(ctx); err != nil {
			return Identity{}, err
		}
	}

	token, err := jwt.Parse([]byte(raw),
		jwt.WithKeySet(keySet),
		jwt.WithIssuer(v.issuer),
		jwt.WithAudience(v.audience),
	)
	if err != nil {
		return Identity{}, ErrUnauthenticated
	}

	var memberID string
	if err := token.Get("preferred_username", &memberID); err != nil || memberID == "" {
		return Identity{}, ErrUnauthenticated
	}

	return Identity{MemberID: memberID}, nil
}

func (v *Validator) loadJWKS() jwk.Set {
	v.cachedMu.RLock()
	defer v.cachedMu.RUnlock()
	return v.cachedJWKS
}

// initJWKS creates the background-refreshing JWKS cache. The cache's context
// is deliberately never cancelled once set up: cancelling it stops the
// refresher, freezing the keys at whatever the first fetch returned.
func (v *Validator) initJWKS(ctx context.Context) (jwk.Set, error) {
	select {
	case v.jwksMu <- struct{}{}:
		defer func() { <-v.jwksMu }()
	case <-ctx.Done():
		return nil, ctx.Err()
	}
	if set := v.loadJWKS(); set != nil {
		return set, nil
	}

	cacheCtx, cancel := context.WithCancel(context.Background())
	ok := false
	defer func() {
		if !ok {
			cancel()
		}
	}()

	cache, err := jwk.NewCache(
		cacheCtx,
		httprc.NewClient(
			httprc.WithTraceSink(tracesink.NewSlog(slog.New(slog.NewJSONHandler(os.Stderr, nil)))),
		),
	)
	if err != nil {
		return nil, err
	}

	if err := cache.Register(
		cacheCtx,
		v.jwksURL,
		jwk.WithMaxInterval(24*time.Hour*7),
		jwk.WithMinInterval(5*time.Minute),
	); err != nil {
		return nil, err
	}

	set, err := cache.CachedSet(v.jwksURL)
	if err != nil {
		return nil, err
	}
	ok = true

	v.cachedMu.Lock()
	v.cachedJWKS = set
	v.cachedMu.Unlock()
	return set, nil
}
