import { env } from "$env/dynamic/private";
import meilisearchSync from "$lib/search/sync";
import { isNollningPeriod } from "$lib/utils/adminSettings/nollning";
import { fileHandler } from "$lib/files";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

export const load = async () => {
  return {
    isNollning: await isNollningPeriod(),
    prismaLogLevel: env.PRISMA_LOG_LEVEL,
    minIOHealthy: await fileHandler.isMinIOHealthy(),
  };
};

export const actions = {
  meilisearchSync: async ({ locals }) => {
    authorize(apiNames.ADMIN.CORE, locals.user);
    return meilisearchSync();
  },
};
