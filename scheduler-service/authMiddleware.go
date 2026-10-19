package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/httprc/v3/tracesink"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

type ctxKey string

const jwtSubjectCtxKey ctxKey = "jwtSubject"

// cachedJWKS is a live view of the jwk.Cache, which keeps re-fetching the
// key set in the background so key rotations are picked up. Guarded by
// cachedJWKSMu since it's set lazily on the first request.
var (
	cachedJWKSMu sync.Mutex
	cachedJWKS   jwk.Set
)

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		keySet, err := getJWKS()
		if err != nil {
			log.Printf("Failed to create JWK cache: %s", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)

			return
		}

		parseOptions := []jwt.ParseOption{
			jwt.WithKeySet(keySet),
			jwt.WithIssuer(JWTIssuer),
			jwt.WithAudience(JWTAudience),
		}

		token, err := jwt.Parse([]byte(getTokenFromHeader(r)), parseOptions...)
		if err != nil {
			log.Printf("Failed to parse JWT: %s", err)
			http.Error(w, "Unauthorised", http.StatusUnauthorized)

			return
		}

		subject, _ := token.Subject()
		if subject == "" {
			log.Printf("Invalid subject in JWT: subject is empty")
			http.Error(w, "Unauthorised", http.StatusUnauthorized)

			return
		}

		ctx := context.WithValue(r.Context(), jwtSubjectCtxKey, subject)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getTokenFromHeader(r *http.Request) string {
	stringToken := r.Header.Get("Authorization")

	const bearerPrefix = "Bearer "
	if !strings.HasPrefix(stringToken, bearerPrefix) {
		return ""
	}

	stringToken = strings.TrimPrefix(stringToken, bearerPrefix)

	return stringToken
}

func getJWKS() (jwk.Set, error) {
	cachedJWKSMu.Lock()
	defer cachedJWKSMu.Unlock()

	if cachedJWKS == nil {
		set, err := createJWKCache()
		if err != nil {
			return nil, err
		}
		cachedJWKS = set
	}

	return cachedJWKS, nil
}

// createJWKCache sets up the background-refreshing JWKS cache. Its context is
// deliberately never cancelled once set up: cancelling it stops the
// refresher, freezing the keys at whatever the first fetch returned.
func createJWKCache() (jwk.Set, error) {
	ctx, cancel := context.WithCancel(context.Background())
	ok := false
	defer func() {
		if !ok {
			cancel()
		}
	}()

	jwkCache, err := jwk.NewCache(
		ctx,
		httprc.NewClient(
			httprc.WithTraceSink(tracesink.NewSlog(slog.New(slog.NewJSONHandler(os.Stderr, nil)))),
		),
	)
	if err != nil {
		log.Printf("Failed to create JWK cache: %s", err)

		return nil, err
	}

	if err = jwkCache.Register(
		ctx,
		JWKSEndpoint,
		jwk.WithMaxInterval(24*time.Hour*7),
		jwk.WithMinInterval(5*time.Minute),
	); err != nil {
		log.Printf("Failed to register JWK endpoint: %s", err)

		return nil, err
	}

	set, err := jwkCache.CachedSet(JWKSEndpoint)
	if err != nil {
		log.Printf("Failed to get cached JWK set: %s", err)

		return nil, err
	}
	ok = true

	return set, nil
}
