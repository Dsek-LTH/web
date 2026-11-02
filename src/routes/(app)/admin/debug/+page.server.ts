import { env } from "$env/dynamic/private";
import meilisearchSync from "$lib/search/sync";
import { serverApi } from "$lib/server/apiClient";
import { fileHandler } from "$lib/files";
import { authorize } from "$lib/utils/authorization";

export const load = async (event) => {
  const currentRes = await serverApi(event).GET("/nollning/current", {});
  return {
    isNollning: currentRes.data?.phase !== "off",
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
