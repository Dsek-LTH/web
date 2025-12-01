package main

import (
	"log"
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

var (
	limiters = make(map[string]*trackedLimiter)
	mu       sync.Mutex
)

type trackedLimiter struct {
	*rate.Limiter
	lastSeen time.Time
}

func cleanupLimiters(expiry time.Duration) {
	now := time.Now()
	for ip, limiter := range limiters {
		if now.Sub(limiter.lastSeen) > expiry {
			delete(limiters, ip)
		}
	}
}

func getLimiter(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	cleanupLimiters(10 * time.Minute)
	log.Println("Current limiters:", len(limiters))

	lim, exists := limiters[ip]
	if !exists {
		lim = &trackedLimiter{
			Limiter:  rate.NewLimiter(1, 5),
			lastSeen: time.Now(),
		}
		limiters[ip] = lim
	} else {
		lim.lastSeen = time.Now()
	}

	return lim.Limiter
}

func rateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			host = r.RemoteAddr
		}

		limiter := getLimiter(host)
		if !limiter.Allow() {
			http.Error(w, "Too Many Requests", http.StatusTooManyRequests)

			return
		}

		next.ServeHTTP(w, r)
	})
}
