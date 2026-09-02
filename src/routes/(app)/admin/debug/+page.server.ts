import { env } from "$env/dynamic/private";
import meilisearchSync from "$lib/search/sync";
import { api } from "$lib/api/client";
import { fileHandler } from "$lib/files";

export const load = async ({ fetch }) => {
  const currentRes = await api.GET("/nollning/current", { fetch });
  return {
    isNollning: currentRes.data?.phase !== "off",
    prismaLogLevel: env.PRISMA_LOG_LEVEL,
    minIOHealthy: await fileHandler.isMinIOHealthy(),
  };
};

export const actions = {
  meilisearchSync,
};
