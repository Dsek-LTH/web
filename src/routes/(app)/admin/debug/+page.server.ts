import { env } from "$env/dynamic/private";
import meilisearchSync from "$lib/search/sync";
import { isNollningPeriod } from "$lib/utils/adminSettings/nollning";
import { fileHandler } from "$lib/files";
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
    authorize("core:admin", locals.user);
    return meilisearchSync();
  },
};
