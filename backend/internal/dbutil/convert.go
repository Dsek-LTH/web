// Package dbutil holds small pgtype<->Go conversion helpers shared by every
// domain service layer (internal/articles, internal/events, ...) that talks
// to internal/db - extracted once the same ~10 functions started getting
// duplicated across packages, same reasoning as internal/slug.
package dbutil

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func UUIDStr(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return uuid.UUID(u.Bytes).String()
}

func UUIDStrPtr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := UUIDStr(u)
	return &s
}

func TextPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

func TimePtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}

// ParseUUID parses a client-supplied UUID string into pgtype.UUID.
func ParseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}

// ParseUUIDPtr parses an optional client-supplied UUID string; a nil input
// yields an invalid (SQL NULL) pgtype.UUID rather than an error.
func ParseUUIDPtr(s *string) (pgtype.UUID, error) {
	if s == nil {
		return pgtype.UUID{}, nil
	}
	return ParseUUID(*s)
}

// ParseUUIDs parses a list of client-supplied UUID strings. An empty input
// deliberately returns a nil (not empty) slice: pgx encodes nil as SQL NULL
// for array params and a non-nil empty slice as '{}', and tag-id filters
// (e.g. ListArticles/ListEvents) rely on NULL meaning "no filter" rather
// than "match nothing".
func ParseUUIDs(ss []string) ([]pgtype.UUID, error) {
	if len(ss) == 0 {
		return nil, nil
	}
	result := make([]pgtype.UUID, len(ss))
	for i, s := range ss {
		u, err := ParseUUID(s)
		if err != nil {
			return nil, err
		}
		result[i] = u
	}
	return result, nil
}

// TextOrInvalid treats both a nil and an empty string as "not provided",
// matching the TS backend's `filters.search && filters.search.length > 0`
// check for search filters.
func TextOrInvalid(s *string) pgtype.Text {
	if s == nil || *s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *s, Valid: true}
}

// ToText converts an optional string into pgtype.Text, distinguishing "not
// provided" (nil) from an explicit empty string.
func ToText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *s, Valid: true}
}

// ToBool wraps a plain bool as pgtype.Bool - for the `sqlc.narg('x')::bool`
// pattern used by optional boolean query filters (e.g. an "include
// soft-deleted rows" flag), always Valid since there's no "unset" bool at
// the call site the way there is for ToText's nil string.
func ToBool(b bool) pgtype.Bool {
	return pgtype.Bool{Bool: b, Valid: true}
}

func ToTimestamptz(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}

// ResolveName picks en if locale is "en" and it's set, sv otherwise - the
// server-side replacement for Prisma's old translationExtension fallback
// rule (see backend/CLAUDE.md's Locale note).
func ResolveName(sv string, en *string, locale string) string {
	if locale == "en" && en != nil && *en != "" {
		return *en
	}
	return sv
}

// ResolveNullableName is ResolveName for a translated pair where the sv
// column is itself nullable (unlike e.g. articles/events/committees' name
// fields, always NOT NULL) - description-style fields being the common
// case. nil in (sv unset), nil out, rather than resolving against an empty
// string.
func ResolveNullableName(sv, en pgtype.Text, locale string) *string {
	if !sv.Valid {
		return nil
	}
	resolved := ResolveName(sv.String, TextPtr(en), locale)
	return &resolved
}

func StringOr(s *string, fallback string) string {
	if s == nil {
		return fallback
	}
	return *s
}

func Int4Ptr(i pgtype.Int4) *int32 {
	if !i.Valid {
		return nil
	}
	return &i.Int32
}

// ToInt4 converts an optional int32 into pgtype.Int4, distinguishing "not
// provided" (nil) from an explicit value - same convention as ToText.
func ToInt4(i *int32) pgtype.Int4 {
	if i == nil {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: *i, Valid: true}
}

// DatePtr formats a pgtype.Date as "YYYY-MM-DD" - dates are exchanged with
// clients as plain date strings (no time-of-day/timezone), not RFC3339
// timestamps.
func DatePtr(d pgtype.Date) *string {
	if !d.Valid {
		return nil
	}
	s := d.Time.Format("2006-01-02")
	return &s
}

// ParseDate parses a client-supplied "YYYY-MM-DD" date string.
func ParseDate(s string) (pgtype.Date, error) {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return pgtype.Date{}, err
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}
