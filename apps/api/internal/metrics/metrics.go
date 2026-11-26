// Package metrics is the API's Prometheus metrics, served on /metrics to a
// scraper holding METRICS_TOKEN. The names match what the SvelteKit app
// exported (apps/web/src/lib/server/metrics.ts, and the push metrics it had
// before push moved here), so the Grafana dashboards read both; Prometheus
// tells them apart by job.
package metrics

import (
	"crypto/subtle"
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var registry = prometheus.NewRegistry()

var (
	httpRequests = prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Total number of HTTP requests",
	}, []string{"method", "route", "status_code"})
	httpDuration = prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "http_request_duration_ms",
		Help:    "Duration of HTTP requests in ms",
		Buckets: []float64{50, 100, 200, 500, 1000, 2000, 5000},
	}, []string{"method", "route", "status_code"})
	inflight = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "inflight_requests",
		Help: "Number of in-progress requests",
	})

	pushMessages = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "push_notifications_messages_total",
		Help: "Total number of push notification messages attempted to send",
	})
	pushFailedMessages = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "push_notifications_failed_messages_total",
		Help: "Total number of push notification messages that failed",
	})
	pushFailedChunks = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "push_notifications_chunks_failed_total",
		Help: "Total number of push notification chunks that failed to send",
	})
	pushDuration = prometheus.NewHistogram(prometheus.HistogramOpts{
		Name:    "push_notification_send_duration_ms",
		Help:    "Duration of sending push notifications in ms",
		Buckets: []float64{50, 100, 200, 500, 1000, 2000},
	})
)

func init() {
	registry.MustRegister(
		httpRequests, httpDuration, inflight,
		pushMessages, pushFailedMessages, pushFailedChunks, pushDuration,
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)
}

func ms(d time.Duration) float64 { return float64(d.Microseconds()) / 1000 }

// RequestStarted counts a request in flight; call the returned func when
// it's done, with the route pattern (not the path, which would make a
// series per URL) and the status.
func RequestStarted() func(method, route string, status int, took time.Duration) {
	inflight.Inc()
	return func(method, route string, status int, took time.Duration) {
		inflight.Dec()
		code := strconv.Itoa(status)
		httpRequests.WithLabelValues(method, route, code).Inc()
		httpDuration.WithLabelValues(method, route, code).Observe(ms(took))
	}
}

// PushSent records one push send: how many messages were attempted, how
// many failed, how many chunks failed outright, and how long it took.
func PushSent(messages, failedMessages, failedChunks int, took time.Duration) {
	pushMessages.Add(float64(messages))
	pushFailedMessages.Add(float64(failedMessages))
	pushFailedChunks.Add(float64(failedChunks))
	pushDuration.Observe(ms(took))
}

// Handler serves the metrics to a request with "Authorization: Bearer
// <token>" and answers 404 to anything else, including every request when
// token is empty, so the endpoint doesn't show it exists.
func Handler(token string) http.Handler {
	metrics := promhttp.HandlerFor(registry, promhttp.HandlerOpts{})
	expected := []byte("Bearer " + token)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got := []byte(r.Header.Get("Authorization"))
		if token == "" || subtle.ConstantTimeCompare(got, expected) != 1 {
			http.NotFound(w, r)
			return
		}
		metrics.ServeHTTP(w, r)
	})
}
