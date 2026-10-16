import { env } from "$env/dynamic/private";
import meilisearchSync from "$lib/search/sync";
import { isN0llningPeriod } from "$lib/utils/adminSettings/nollning";
import { fileHandler } from "$lib/files";

export const load = async () => {
  return {
    isN0llning: await isN0llningPeriod(),
    prismaLogLevel: env.PRISMA_LOG_LEVEL,
    minIOHealthy: await fileHandler.isMinIOHealthy(),
  };
};

export const actions = {
  meilisearchSync,
};
