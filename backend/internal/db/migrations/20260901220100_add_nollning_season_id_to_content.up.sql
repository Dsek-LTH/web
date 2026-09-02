-- Direct FK replacing the old `[NOLLNING]`-tag-name-prefix convention
-- (src/lib/components/postReveal/types.ts's NOLLNING_TAG_PREFIX, matched
-- via startsWith against tags.name_sv) for "is this article/event part of
-- nollning, and which year's". Decided 2026-09-01, see DESIGN.md's
-- "Content classification" note: a direct FK gives referential integrity
-- and composes with ordinary topical tags instead of overloading them.
ALTER TABLE articles ADD COLUMN nollning_season_id UUID REFERENCES nollning_seasons (id);
ALTER TABLE events ADD COLUMN nollning_season_id UUID REFERENCES nollning_seasons (id);

-- Backfill: ensure a season row exists for every year that has at least one
-- article or event carrying a `[NOLLNING]`-prefixed tag (case-insensitive,
-- matching the old startsWith("[NOLLNING]") convention loosely enough to
-- tolerate case drift in hand-typed tag names), then point each such
-- article/event at its year's season. Fallback dates mirror the old
-- hardcoded constants this replaces (REVEAL_LAUNCH_DATE ~ Aug 27,
-- phadderMandateFilter's Aug 1 - Oct 1 window) - these are necessarily
-- approximate for past years since the old data model never stored real
-- season boundaries, only a tag-name convention.
INSERT INTO nollning_seasons (year, nolla_start_at, reveal_at, end_at)
SELECT DISTINCT y,
       make_date(y, 8, 1)::timestamptz,
       make_date(y, 8, 27)::timestamptz + interval '14 hours',
       make_date(y, 10, 1)::timestamptz
FROM (
    SELECT EXTRACT(YEAR FROM COALESCE(a.published_datetime, a.created_datetime))::int AS y
    FROM articles a
    JOIN _article_tags atags ON atags."A" = a.id
    JOIN tags t ON t.id = atags."B"
    WHERE t.name_sv ILIKE '[nollning]%'

    UNION

    SELECT EXTRACT(YEAR FROM e.start_datetime)::int AS y
    FROM events e
    JOIN _event_tags etags ON etags."A" = e.id
    JOIN tags t ON t.id = etags."B"
    WHERE t.name_sv ILIKE '[nollning]%'
) years
ON CONFLICT (year) DO NOTHING;

UPDATE articles a
SET nollning_season_id = s.id
FROM nollning_seasons s
WHERE s.year = EXTRACT(YEAR FROM COALESCE(a.published_datetime, a.created_datetime))::int
  AND EXISTS (
      SELECT 1 FROM _article_tags atags
      JOIN tags t ON t.id = atags."B"
      WHERE atags."A" = a.id AND t.name_sv ILIKE '[nollning]%'
  );

UPDATE events e
SET nollning_season_id = s.id
FROM nollning_seasons s
WHERE s.year = EXTRACT(YEAR FROM e.start_datetime)::int
  AND EXISTS (
      SELECT 1 FROM _event_tags etags
      JOIN tags t ON t.id = etags."B"
      WHERE etags."A" = e.id AND t.name_sv ILIKE '[nollning]%'
  );
