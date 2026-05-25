import { env } from "$env/dynamic/private";
import meilisearchSync from "$lib/search/sync";
import { isIntroductionPeriod } from "$lib/utils/adminSettings/introduction";
import { fileHandler } from "$lib/files";

export const load = async () => {
  return {
    isIntroduction: await isIntroductionPeriod(),
    prismaLogLevel: env.PRISMA_LOG_LEVEL,
    minIOHealthy: await fileHandler.isMinIOHealthy(),
  };
};

export const actions = {
  meilisearchSync,
};
