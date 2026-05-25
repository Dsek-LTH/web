import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";

export const INTRODUCTION_START_KEY = "introduction_start";
export const INTRODUCTION_END_KEY = "introduction_end";
let cache: {
  value: boolean;
  lastFetched: Date;
} | null = null;
const CACHE_TIME = 3600 * 1000; // 1 hour
export const isIntroductionPeriod = async () => {
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
          key: INTRODUCTION_START_KEY,
        },
        {
          key: INTRODUCTION_END_KEY,
        },
      ],
    },
  });
  const startStr = rows.find(
    (row) => row.key === INTRODUCTION_START_KEY,
  )?.value;
  const endStr = rows.find((row) => row.key === INTRODUCTION_END_KEY)?.value;
  if (!startStr || !endStr) return false;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const isIntroductionPeriod = start < now && now < end;
  cache = {
    value: isIntroductionPeriod,
    lastFetched: now,
  };
  return isIntroductionPeriod;
};

export const updateIntroductionPeriod = async (
  prisma: ExtendedPrisma,
  start: Date,
  end: Date,
) => {
  await prisma.adminSetting.upsert({
    where: {
      key: INTRODUCTION_START_KEY,
    },
    update: {
      value: start.toISOString(),
    },
    create: {
      key: INTRODUCTION_START_KEY,
      value: start.toISOString(),
    },
  });
  await prisma.adminSetting.upsert({
    where: {
      key: INTRODUCTION_END_KEY,
    },
    update: {
      value: end.toISOString(),
    },
    create: {
      key: INTRODUCTION_END_KEY,
      value: end.toISOString(),
    },
  });
  const now = new Date();
  const isIntroductionPeriod = start < now && now < end;
  cache = {
    value: isIntroductionPeriod,
    lastFetched: now,
  };
};
