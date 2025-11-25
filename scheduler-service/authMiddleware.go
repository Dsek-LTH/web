package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/httprc/v3/tracesink"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

var cachedJWKS jwk.Set

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if cachedJWKS == nil {
			if err := createJWKCache(); err != nil {
				log.Printf("Failed to create JWK cache: %s", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)

				return
			}
		}

		parseOptions := []jwt.ParseOption{
			jwt.WithKeySet(cachedJWKS),
			jwt.WithIssuer(JWTIssuer),
			jwt.WithAudience(JWTAudience),
		}

		if _, err := jwt.Parse([]byte(getTokenFromHeader(r)), parseOptions...); err != nil {
			log.Printf("Failed to parse JWT: %s", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)

			return
		}

		next.ServeHTTP(w, r)
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

func createJWKCache() error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	jwkCache, err := jwk.NewCache(
		ctx,
		httprc.NewClient(
			httprc.WithTraceSink(tracesink.NewSlog(slog.New(slog.NewJSONHandler(os.Stderr, nil)))),
		),
	)
	if err != nil {
		log.Printf("Failed to create JWK cache: %s", err)

		return err
	}

	if err = jwkCache.Register(
		ctx,
		JWKSEndpoint,
		jwk.WithMaxInterval(24*time.Hour*7),
		jwk.WithMinInterval(5*time.Minute),
	); err != nil {
		log.Printf("Failed to register JWK endpoint: %s", err)

		return err
	}

	cachedJWKS, err = jwkCache.CachedSet(JWKSEndpoint)
	if err != nil {
		log.Printf("Failed to get cached JWK set: %s", err)

		return err
	}

	return nil
}
