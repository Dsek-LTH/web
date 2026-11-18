package events

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/dsek-lth/web/apps/api/internal/db"
	"github.com/dsek-lth/web/apps/api/internal/dbutil"
	"github.com/dsek-lth/web/apps/api/internal/locale"
	"github.com/dsek-lth/web/apps/api/internal/slug"
)

// CalendarFeed picks which events an ICS subscribe feed contains.
type CalendarFeed struct {
	// NollningSeasonID limits the feed to one nollning season's events.
	// Empty means the general feed, which leaves out every season's events.
	NollningSeasonID string
	// EndsBefore, if set, drops events that end after it.
	EndsBefore *time.Time
}

// CalendarICS renders the events in feed, from a month ago onwards, as an
// iCalendar file - what calendar apps subscribed to /events/subscribe (and
// the nollning equivalent) poll. Public, like the event pages. Ported from
// src/lib/server/ics/calendar.ts.
func (s *Service) CalendarICS(ctx context.Context, feed CalendarFeed) ([]byte, error) {
	params := db.ListEventsForCalendarParams{
		StartsAfter:     pgtype.Timestamptz{Time: time.Now().AddDate(0, -1, 0), Valid: true},
		ExcludeNollning: feed.NollningSeasonID == "",
	}
	if feed.EndsBefore != nil {
		params.EndsBefore = pgtype.Timestamptz{Time: *feed.EndsBefore, Valid: true}
	}
	if feed.NollningSeasonID != "" {
		id, err := dbutil.ParseUUID(feed.NollningSeasonID)
		if err != nil {
			return nil, invalidf("invalid nollning season id: %v", err)
		}
		params.NollningSeasonID = id
	}
	rows, err := s.queries.ListEventsForCalendar(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("list calendar events: %w", err)
	}

	loc := locale.FromContext(ctx)
	now := icsTime(time.Now())
	var b strings.Builder
	b.WriteString("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nCALSCALE:GREGORIAN\r\n")
	b.WriteString("PRODID:-//D-sektionen//Events//SV\r\nMETHOD:PUBLISH\r\n")
	for _, row := range rows {
		b.WriteString("BEGIN:VEVENT\r\n")
		writeICSLine(&b, "UID", dbutil.UUIDStr(row.ID))
		writeICSLine(&b, "DTSTAMP", now)
		writeICSLine(&b, "DTSTART", icsTime(row.StartDatetime.Time))
		writeICSLine(&b, "DTEND", icsTime(row.EndDatetime.Time))
		writeICSLine(
			&b,
			"SUMMARY",
			icsEscape(dbutil.ResolveName(row.TitleSv, dbutil.TextPtr(row.TitleEn), loc)),
		)
		writeICSLine(&b, "DESCRIPTION", icsEscape(
			dbutil.ResolveName(row.DescriptionSv, dbutil.TextPtr(row.DescriptionEn), loc),
		))
		if row.Location.Valid {
			writeICSLine(&b, "LOCATION", icsEscape(row.Location.String))
		}
		if row.NumberOfUpdates.Valid {
			writeICSLine(&b, "SEQUENCE", fmt.Sprint(row.NumberOfUpdates.Int32))
		}
		b.WriteString("END:VEVENT\r\n")
	}
	b.WriteString("END:VCALENDAR\r\n")
	return []byte(b.String()), nil
}

func icsTime(t time.Time) string {
	return t.UTC().Format("20060102T150405Z")
}

var icsEscaper = strings.NewReplacer(`\`, `\\`, ";", `\;`, ",", `\,`, "\r\n", `\n`, "\n", `\n`)

func icsEscape(s string) string {
	return icsEscaper.Replace(s)
}

// writeICSLine writes "NAME:value", folded so no line exceeds 75 octets
// (RFC 5545 section 3.1), never splitting a UTF-8 character.
func writeICSLine(b *strings.Builder, name, value string) {
	line := name + ":" + value
	limit := 75
	for len(line) > limit {
		cut := limit
		for cut > 0 && line[cut]&0xC0 == 0x80 {
			cut--
		}
		b.WriteString(line[:cut])
		b.WriteString("\r\n ")
		line = line[cut:]
		limit = 74 // continuation lines start with a space
	}
	b.WriteString(line)
	b.WriteString("\r\n")
}

// AlarmActive reports whether an event with its alarm switched on is
// running right now - served as "true"/"false" at /api/alarm on the
// SvelteKit side, for whatever polls it. Public, like the old endpoint.
func (s *Service) AlarmActive(ctx context.Context) (bool, error) {
	active, err := s.queries.AnyAlarmActiveEventNow(ctx)
	if err != nil {
		return false, fmt.Errorf("check alarm: %w", err)
	}
	return active, nil
}

// SlugForID returns a non-removed event's slug, for the legacy
// /events/id/{id} links. An event that predates slugs gets one generated
// and saved first, the way the old endpoint backfilled them.
func (s *Service) SlugForID(ctx context.Context, eventID string) (string, error) {
	id, err := dbutil.ParseUUID(eventID)
	if err != nil {
		return "", ErrNotFound
	}
	row, err := s.queries.GetEventSlugByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", fmt.Errorf("get event: %w", err)
	}
	if row.Slug.Valid {
		return row.Slug.String, nil
	}

	base := slug.Slugify(row.TitleSv)
	count, err := s.queries.CountEventSlugsWithPrefix(
		ctx,
		pgtype.Text{String: dbutil.EscapeLike(base), Valid: true},
	)
	if err != nil {
		return "", fmt.Errorf("count slugs: %w", err)
	}
	newSlug := slug.SlugWithCount(base, int(count))
	if err := s.queries.SetEventSlug(ctx, db.SetEventSlugParams{
		ID:   id,
		Slug: pgtype.Text{String: newSlug, Valid: true},
	}); err != nil {
		return "", fmt.Errorf("set slug: %w", err)
	}
	return newSlug, nil
}
