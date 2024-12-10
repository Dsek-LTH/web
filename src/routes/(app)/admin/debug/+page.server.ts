import { env } from "$env/dynamic/private";
import keycloak from "$lib/server/keycloak";
// import meilisearchSync from "$lib/search/sync";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import { isNollningPeriod } from "$lib/utils/adminSettings/nollning";

export const load = async () => {
  return {
    isNollning: await isNollningPeriod(),
    prismaLogLevel: env.PRISMA_LOG_LEVEL,
  };
};

export const actions = {
  keycloakSync: async () => {
    keycloak.sync(authorizedPrismaClient);
  },
  // meilisearchSync,
};
