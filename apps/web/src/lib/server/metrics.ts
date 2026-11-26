import client from "@prometheus-io/client";

// Create an HTTP request counter with method and route labels
export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

// Histogram for request durations in milliseconds
export const httpRequestDurationMs = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "status_code"],
  buckets: [50, 100, 200, 500, 1000, 2000, 5000],
});

// Gauge for in-flight requests
export const inflightRequests = new client.Gauge({
  name: "inflight_requests",
  help: "Number of in-progress requests",
});

export function registerMetrics() {
  return client.register;
}

export default client;
