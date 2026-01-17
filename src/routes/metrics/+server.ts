import type { RequestHandler } from "@sveltejs/kit";
import { registerMetrics } from "$lib/server/metrics";

export const GET: RequestHandler = async () => {
  const registry = registerMetrics();
  const metrics = await registry.metrics();

  return new Response(metrics, {
    status: 200,
    headers: { "Content-Type": registry.contentType },
  });
};
