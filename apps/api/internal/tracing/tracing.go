// Package tracing sends OpenTelemetry traces over OTLP/HTTP when an
// endpoint is configured with the standard variables
// (OTEL_EXPORTER_OTLP_TRACES_ENDPOINT, a full URL, or
// OTEL_EXPORTER_OTLP_ENDPOINT, a base URL), named OTEL_SERVICE_NAME
// (dsek-api by default) with any OTEL_RESOURCE_ATTRIBUTES. Without an
// endpoint everything stays a no-op. Incoming requests continue the
// caller's trace (W3C traceparent, as the SvelteKit server sends it), so a
// page load is one trace across both.
package tracing

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

// Setup installs the tracer provider and propagator, and makes outgoing
// requests through http.DefaultTransport traced. The returned function
// flushes spans; call it before exiting. Errors are logged, not fatal: the
// backend runs fine without traces.
func Setup(ctx context.Context) func(context.Context) {
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{}, propagation.Baggage{},
	))
	if !Enabled() {
		return func(context.Context) {}
	}

	exporter, err := otlptracehttp.New(ctx)
	if err != nil {
		slog.Error("tracing: create exporter, traces are off", "err", err)
		return func(context.Context) {}
	}
	name := os.Getenv("OTEL_SERVICE_NAME")
	if name == "" {
		name = "dsek-api"
	}
	// Schemaless, so it merges with the default resource (which also reads
	// OTEL_RESOURCE_ATTRIBUTES) whatever semconv version that uses.
	res, err := resource.Merge(resource.Default(),
		resource.NewSchemaless(attribute.String("service.name", name)))
	if err != nil {
		slog.Error("tracing: build resource, traces are off", "err", err)
		return func(context.Context) {}
	}
	provider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(provider)
	http.DefaultTransport = otelhttp.NewTransport(http.DefaultTransport)
	slog.Info("tracing: on", "service", name)

	return func(ctx context.Context) {
		if err := provider.Shutdown(ctx); err != nil {
			slog.Error("tracing: flush spans", "err", err)
		}
	}
}

// Enabled reports whether an OTLP endpoint is configured.
func Enabled() bool {
	return os.Getenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT") != "" ||
		os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT") != ""
}

// Handler wraps the server so every request gets a span (continuing the
// caller's trace). Route-specific span names are set by internal/api.
func Handler(next http.Handler) http.Handler {
	return otelhttp.NewHandler(next, "request",
		otelhttp.WithSpanNameFormatter(func(_ string, r *http.Request) string {
			return r.Method + " " + r.URL.Path
		}),
	)
}

// Transport wraps a transport so its requests get client spans - for
// clients that don't use http.DefaultTransport (MinIO).
func Transport(base http.RoundTripper) http.RoundTripper {
	return otelhttp.NewTransport(base)
}
