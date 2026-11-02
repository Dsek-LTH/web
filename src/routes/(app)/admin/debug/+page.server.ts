import { env } from "$env/dynamic/private";
import { serverApi } from "$lib/server/apiClient";
import { fileHandler } from "$lib/files";
import { fail } from "@sveltejs/kit";

export const load = async (event) => {
  const currentRes = await serverApi(event).GET("/nollning/current", {});
  return {
    isNollning: currentRes.data?.phase !== "off",
    prismaLogLevel: env.PRISMA_LOG_LEVEL,
    minIOHealthy: await fileHandler.isMinIOHealthy(),
  };
};

export const actions = {
  // Starts the rebuild in the background (Go answers 202 straight away).
  meilisearchSync: async (event) => {
    const res = await serverApi(event).POST("/search/sync", {});
    if (res.error) {
      return fail(res.response.status, {
        message: res.error.detail ?? "Sync failed",
      });
    }
    return { message: "Sync started" };
  },
};
