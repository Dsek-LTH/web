-- One row per nollning year, replacing the AdminSetting-backed
-- nollning_start/nollning_end keys (src/lib/utils/adminSettings/nollning.ts)
-- plus every hardcoded per-year date scattered across the old TS app
-- (REVEAL_LAUNCH_DATE, nolla's CUTOFF_DATE, the nollning-events page's
-- weekStarts array) - see DESIGN.md's "Nollning: proposed redesign".
--
-- organizing_committee_id names which committee's mandates count as
-- "staben" for IsStaben/SEE_STABEN purposes (see internal/nollning) -
-- explicit and per-season rather than a hardcoded "nollu" shortName
-- comparison, so it can be repointed without a code change if the
-- organizing committee is ever restructured.
CREATE TABLE nollning_seasons (
    id                      UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    year                    INTEGER NOT NULL UNIQUE,
    nolla_start_at          TIMESTAMPTZ NOT NULL,
    reveal_at               TIMESTAMPTZ NOT NULL,
    end_at                  TIMESTAMPTZ NOT NULL,
    organizing_committee_id UUID REFERENCES committees (id),
    CONSTRAINT nollning_seasons_dates_ordered
        CHECK (nolla_start_at <= reveal_at AND reveal_at <= end_at)
);
