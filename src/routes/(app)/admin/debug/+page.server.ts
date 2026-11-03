import { MINIO_BASE_URL } from "$lib/files/client";
import { serverApi } from "$lib/server/apiClient";
import { fail } from "@sveltejs/kit";

// MinIO's own liveness probe, on its public URL:
// https://min.io/docs/minio/linux/operations/monitoring/healthcheck-probe.html
const isMinIOHealthy = (fetch: typeof globalThis.fetch) =>
  fetch(`${MINIO_BASE_URL}minio/health/live`, { cache: "reload" })
    .then((res) => res.ok)
    .catch(() => false);

export const load = async (event) => {
  const currentRes = await serverApi(event).GET("/nollning/current", {});
  return {
    isNollning: currentRes.data?.phase !== "off",
    minIOHealthy: await isMinIOHealthy(event.fetch),
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
