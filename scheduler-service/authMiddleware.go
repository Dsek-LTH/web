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

const (
	JWKSEndpoint   = "https://auth.dsek.se/application/o/dev/jwks/"
	sampleIssuer   = "https://auth.dsek.se/application/o/dev/"
	sampleAudience = "SvRybUTCGqhNiw2Y3gn1wqt0YxpjW2sv9fbPsUaP"
)

var cachedJWKS jwk.Set

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		stringToken := r.Header.Get("Authorization")

		const bearerPrefix = "Bearer "
		if !strings.HasPrefix(stringToken, bearerPrefix) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)

			return
		}

		stringToken = strings.TrimPrefix(stringToken, bearerPrefix)

		query := r.URL.Query()
		subject := query.Get("subject")

		if subject == "" {
			http.Error(w, "Missing subject query parameter", http.StatusBadRequest)

			return
		}

		if cachedJWKS == nil {
			if err := createJWKCache(); err != nil {
				log.Printf("Failed to create JWK cache: %s", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)

				return
			}
		}

		// TODO: Stop using sample constants
		parseOptions := []jwt.ParseOption{
			jwt.WithKeySet(cachedJWKS),
			jwt.WithIssuer(sampleIssuer),
			jwt.WithAudience(sampleAudience),
			jwt.WithSubject(subject),
		}

		if _, err := jwt.Parse([]byte(stringToken), parseOptions...); err != nil {
			log.Printf("Failed to parse JWT: %s", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)

			return
		}

		next.ServeHTTP(w, r)
	})
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

// func main() {
// 	http.Handle("/test", AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		_, _ = w.Write([]byte("test"))
// 	})))
//
// 	log.Println("Server running on :8080")
// 	log.Fatal(http.ListenAndServe(":8080", nil))
// }

// func main() {
// 	set, err := jwk.Fetch(context.Background(), JWKSEndpoint)
// 	if err != nil {
// 		log.Printf("Failed to parse JWK: %s", err)
//
// 		return
// 	}
//
// 	opts := []jwt.ParseOption{
// 		jwt.WithKeySet(set),
// 		jwt.WithIssuer(sampleIssuer),
// 		jwt.WithAudience(sampleAudience),
// 		jwt.WithSubject(sampleSubject),
// 	}
// 	token, err := jwt.Parse([]byte(sampleJWT), opts...)
// 	if err != nil {
// 		log.Printf("Failed to parse JWT: %s", err)
//
// 		return
// 	}
//
// 	log.Printf("JWT Claims: %+v", token)
//
// 	subject, _ := token.Subject()
// 	log.Printf("Subject: %s", subject)
//
// 	// json.NewEncoder(os.Stdout).Encode(set)
//
// 	// for i := 0; i < set.Len(); i++ {
// 	// 	var rawKey any
// 	// 	key, ok := set.Key(i)
// 	// 	if !ok {
// 	// 		log.Printf("Failed to get key at index %d", i)
// 	//
// 	// 		return
// 	// 	}
// 	//
// 	// 	if err = jwk.Export(key, &rawKey); err != nil {
// 	// 		log.Printf("Failed to create public key: %s", err)
// 	//
// 	// 		return
// 	// 	}
// 	//
// 	// 	log.Printf("Key %d: %+v", i, rawKey)
// 	// }
// }
