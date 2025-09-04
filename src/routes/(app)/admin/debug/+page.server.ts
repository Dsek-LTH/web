import { env } from "$env/dynamic/private";
import authentik from "$lib/server/authentik";
import meilisearchSync from "$lib/search/sync";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { isNollningPeriod } from "$lib/utils/adminSettings/nollning";
import { fileHandler } from "$lib/files";

export const load = async () => {
  return {
    isNollning: await isNollningPeriod(),
    prismaLogLevel: env.PRISMA_LOG_LEVEL,
    minIOHealthy: await fileHandler.isMinIOHealthy(),
  };
};

export const actions = {
  authentikSync: async () => {
    authentik.sync(authorizedPrismaClient);
  },
  meilisearchSync,
};
