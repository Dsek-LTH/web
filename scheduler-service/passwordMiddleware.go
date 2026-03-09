package main

import (
	"log"
	"net/http"
	"os"
)

func passwordMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		password := r.URL.Query().Get("password")
		if password != os.Getenv("PASSWORD") {
			log.Printf("Unauthorised access attempt from %s", r.RemoteAddr)
			http.Error(w, "Unauthorised", http.StatusUnauthorized)

			return
		}

		next.ServeHTTP(w, r)
	})
}
