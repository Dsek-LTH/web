import type { RequestHandler } from "./$types";
import authentik from "$lib/server/authentik";
import meilisearchSync from "$lib/search/sync";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { error } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request }) => {
  // extract body
  const body = await request.text();

  if (body === process.env["SYNC_PASSWORD"]) {
    try {
      authentik.sync(authorizedPrismaClient);
      meilisearchSync();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exception should be any
    } catch (e: any) {
      throw error(500, e.message);
    }
    return new Response();
  }
  throw error(403);
};
