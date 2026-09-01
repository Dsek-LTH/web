-- Replaces phadder_groups.year (a bare int with no relation to the actual
-- nollning time window - see DESIGN.md's "Phadder-group membership becomes
-- one function, not two independent ones") with a real FK to
-- nollning_seasons, fixing the same "hardcoded/duplicated year" problem
-- articles/events' nollning_season_id fixes for content.
ALTER TABLE phadder_groups ADD COLUMN season_id UUID REFERENCES nollning_seasons (id);

-- Backfill: ensure a season exists for every year phadder_groups currently
-- references (fallback dates match the previous migration's rule), then
-- point each group at it.
INSERT INTO nollning_seasons (year, nolla_start_at, reveal_at, end_at)
SELECT DISTINCT g.year,
       make_date(g.year, 8, 1)::timestamptz,
       make_date(g.year, 8, 27)::timestamptz + interval '14 hours',
       make_date(g.year, 10, 1)::timestamptz
FROM phadder_groups g
ON CONFLICT (year) DO NOTHING;

UPDATE phadder_groups g
SET season_id = s.id
FROM nollning_seasons s
WHERE s.year = g.year;

ALTER TABLE phadder_groups ALTER COLUMN season_id SET NOT NULL;
ALTER TABLE phadder_groups DROP COLUMN year;
