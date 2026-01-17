import client from "prom-client";

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

// Push notification metrics
export const pushNotificationsMessagesTotal = new client.Counter({
  name: "push_notifications_messages_total",
  help: "Total number of push notification messages attempted to send",
});

export const pushNotificationsFailedMessagesTotal = new client.Counter({
  name: "push_notifications_failed_messages_total",
  help: "Total number of push notification messages that failed",
});

export const pushNotificationsChunksFailedTotal = new client.Counter({
  name: "push_notifications_chunks_failed_total",
  help: "Total number of push notification chunks that failed to send",
});

export const pushNotificationSendDurationMs = new client.Histogram({
  name: "push_notification_send_duration_ms",
  help: "Duration of sending push notifications in ms",
  buckets: [50, 100, 200, 500, 1000, 2000],
});

export function registerMetrics() {
  return client.register;
}

export default client;
