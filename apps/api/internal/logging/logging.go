// Package logging configures the backend's structured logger (log/slog).
// Everything logs through slog's default logger with key/value attributes;
// LOG_FORMAT=json makes it one JSON object per line (what deployments use,
// for the cluster's log collection), anything else readable text.
package logging

import (
	"log/slog"
	"os"
	"strings"
)

// Setup makes slog's default logger (and the standard log package, which
// slog takes over) write in the configured format to stderr.
func Setup() {
	opts := &slog.HandlerOptions{Level: level(os.Getenv("LOG_LEVEL"))}
	var handler slog.Handler
	if strings.EqualFold(os.Getenv("LOG_FORMAT"), "json") {
		handler = slog.NewJSONHandler(os.Stderr, opts)
	} else {
		handler = slog.NewTextHandler(os.Stderr, opts)
	}
	slog.SetDefault(slog.New(handler))
}

// level reads LOG_LEVEL (debug, info, warn, error); info by default.
func level(s string) slog.Level {
	var l slog.Level
	if err := l.UnmarshalText([]byte(s)); err != nil {
		return slog.LevelInfo
	}
	return l
}

// Fatal logs msg at error level and exits - for startup failures.
func Fatal(msg string, args ...any) {
	slog.Error(msg, args...)
	os.Exit(1)
}
