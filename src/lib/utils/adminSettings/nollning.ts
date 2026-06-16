import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";

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

export const updateNollningPeriod = async (
  prisma: ExtendedPrisma,
  start: Date,
  end: Date,
) => {
  await prisma.adminSetting.upsert({
    where: {
      key: NOLLNING_START_KEY,
    },
    update: {
      value: start.toISOString(),
    },
    create: {
      key: NOLLNING_START_KEY,
      value: start.toISOString(),
    },
  });
  await prisma.adminSetting.upsert({
    where: {
      key: NOLLNING_END_KEY,
    },
    update: {
      value: end.toISOString(),
    },
    create: {
      key: NOLLNING_END_KEY,
      value: end.toISOString(),
    },
  });
  const now = new Date();
  const isNollningPeriod = start < now && now < end;
  cache = {
    value: isNollningPeriod,
    lastFetched: now,
  };
};
