import authorizedPrismaClient from "$lib/server/authorizedPrisma";

// isNollningPeriod/getNollningStart's only remaining caller is
// gallery/+page.server.ts's staben-album date-filtering hack, a
// documented Phase 4 gap (see backend/DESIGN.md's nollning section -
// gallery gets a real nollning_season_id/staben flag on albums once
// Phase 4 ports real file storage; not solved here). Every other
// consumer (admin/settings, hooks.server.helpers.ts, the (nollning)/
// layouts, api/nollning, api/members/phadders) now calls the Go backend
// instead - see backend/CLAUDE.md's "Nollning routes" section.
// updateNollningPeriod (the write path) was deleted: nothing writes to
// these AdminSetting rows anymore, admin/settings now creates/updates
// real nollning_seasons rows via the Go API instead - these two rows are
// permanently frozen at whatever value they last held, which is fine
// since gallery's own read of them is already a known-stale gap pending
// Phase 4, not something this leaves newly broken.
export const NOLLNING_START_KEY = "nollning_start";
export const NOLLNING_END_KEY = "nollning_end";
let cache: {
  value: boolean;
  lastFetched: Date;
} | null = null;

let startCache: {
  value: Date;
  lastFetched: Date;
} | null = null;

const CACHE_TIME = 3600 * 1000; // 1 hour

export const isNollningPeriod = async () => {
  const now = new Date();
  if (
    cache !== null &&
    cache.lastFetched.valueOf() + CACHE_TIME > now.valueOf()
  )
    return cache.value;
  const rows = await authorizedPrismaClient.adminSetting.findMany({
    where: {
      OR: [
        {
          key: NOLLNING_START_KEY,
        },
        {
          key: NOLLNING_END_KEY,
        },
      ],
    },
  });
  const startStr = rows.find((row) => row.key === NOLLNING_START_KEY)?.value;
  const endStr = rows.find((row) => row.key === NOLLNING_END_KEY)?.value;
  if (!startStr || !endStr) return false;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const isNollningPeriod = start < now && now < end;
  cache = {
    value: isNollningPeriod,
    lastFetched: now,
  };
  return isNollningPeriod;
};

export const getNollningStart = async () => {
  const now = new Date();
  if (
    startCache !== null &&
    startCache.lastFetched.valueOf() + CACHE_TIME > now.valueOf()
  )
    return startCache.value;
  const row = await authorizedPrismaClient.adminSetting.findUnique({
    where: {
      key: NOLLNING_START_KEY,
    },
  });
  const startStr = row?.value;
  if (!startStr) {
    return null;
  }
  const start = new Date(startStr);
  startCache = {
    value: start,
    lastFetched: now,
  };
  return start;
};
