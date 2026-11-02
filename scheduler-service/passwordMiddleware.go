package main

import (
	"log"
	"net/http"
	"os"
)

// sharedSecretHeader carries the shared PASSWORD secret. A dedicated header
// (rather than the query string, or the "Authorization" header) is used
// because "Authorization" is already occupied by the per-caller JWT that
// authMiddleware validates on this service's own /schedule API, and query
// strings tend to leak into proxy/access logs.
const sharedSecretHeader = "X-Scheduler-Secret"

func passwordMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		password := r.Header.Get(sharedSecretHeader)
		if password == "" || password != os.Getenv("PASSWORD") {
			log.Printf("Unauthorised access attempt from %s", r.RemoteAddr)
			http.Error(w, "Unauthorised", http.StatusUnauthorized)

			return
		}

		next.ServeHTTP(w, r)
	})
}
