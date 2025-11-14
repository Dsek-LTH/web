package main

import (
	"context"
	"encoding/json"
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

type AuthRequestData struct {
	Subject string `json:"subject"`
}

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
			log.Printf("missing or invalid Authorization header")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)

			return
		}

		stringToken = strings.TrimPrefix(stringToken, bearerPrefix)

		var data AuthRequestData
		err := json.NewDecoder(r.Body).Decode(&data)
		if err != nil {
			log.Printf("failed to decode auth request data: %s", err)
			http.Error(w, "Invalid JSON", http.StatusBadRequest)

			return
		}

		if cachedJWKS == nil {
			if err = createJWKCache(); err != nil {
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)

				return
			}
		}

		// TODO: Stop using sample constants
		parseOptions := []jwt.ParseOption{
			jwt.WithKeySet(cachedJWKS),
			jwt.WithIssuer(sampleIssuer),
			jwt.WithAudience(sampleAudience),
			jwt.WithSubject(data.Subject),
		}

		_, err = jwt.Parse([]byte(stringToken), parseOptions...)
		if err != nil {
			log.Printf("failed to parse JWT: %s", err)
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
		log.Printf("failed to create JWK cache: %s", err)

		return err
	}

	if err = jwkCache.Register(
		ctx,
		JWKSEndpoint,
		jwk.WithMaxInterval(24*time.Hour*7),
		jwk.WithMinInterval(5*time.Minute),
	); err != nil {
		log.Printf("failed to register JWK endpoint: %s", err)

		return err
	}

	cachedJWKS, err = jwkCache.CachedSet(JWKSEndpoint)
	if err != nil {
		log.Printf("failed to get cached JWK set: %s", err)

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
// 		log.Printf("failed to parse JWK: %s", err)
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
// 		log.Printf("failed to parse JWT: %s", err)
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
// 	// 		log.Printf("failed to get key at index %d", i)
// 	//
// 	// 		return
// 	// 	}
// 	//
// 	// 	if err = jwk.Export(key, &rawKey); err != nil {
// 	// 		log.Printf("failed to create public key: %s", err)
// 	//
// 	// 		return
// 	// 	}
// 	//
// 	// 	log.Printf("Key %d: %+v", i, rawKey)
// 	// }
// }
