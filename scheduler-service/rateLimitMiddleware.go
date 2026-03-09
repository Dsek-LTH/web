package main

import (
	"log"
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

var limiterManager = struct {
	limiters map[string]*trackedLimiter
	mu       sync.Mutex
}{
	limiters: make(map[string]*trackedLimiter),
}

type trackedLimiter struct {
	*rate.Limiter
	lastSeen time.Time
}

func cleanupLimiters(expiry time.Duration) {
	now := time.Now()
	for ip, limiter := range limiterManager.limiters {
		if now.Sub(limiter.lastSeen) > expiry {
			delete(limiterManager.limiters, ip)
		}
	}
}

func getLimiter(ip string) *rate.Limiter {
	limiterManager.mu.Lock()
	defer limiterManager.mu.Unlock()

	cleanupLimiters(10 * time.Minute)
	log.Println("Current limiters:", len(limiterManager.limiters))

	lim, exists := limiterManager.limiters[ip]
	if !exists {
		lim = &trackedLimiter{
			Limiter:  rate.NewLimiter(1, 5),
			lastSeen: time.Now(),
		}
		limiterManager.limiters[ip] = lim
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
