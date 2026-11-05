import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { registerMetrics } from "$lib/server/metrics";

const isAuthorized = (header: string | null) => {
  const token = env["METRICS_TOKEN"];
  if (!token || !header) return false;
  const expected = Buffer.from(`Bearer ${token}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const GET: RequestHandler = async ({ request }) => {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return new Response("Not Found", { status: 404 });
  }

  const registry = registerMetrics();
  const metrics = await registry.metrics();

  return new Response(metrics, {
    status: 200,
    headers: { "Content-Type": registry.contentType },
  });
};
