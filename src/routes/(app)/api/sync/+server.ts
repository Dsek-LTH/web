import type { RequestHandler } from "./$types";
import authentik from "$lib/server/authentik";
import meilisearchSync from "$lib/search/sync";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { error } from "@sveltejs/kit";

export const POST: RequestHandler = async () => {
  try {
    authentik.sync(authorizedPrismaClient);
    meilisearchSync();
  } catch (e: any) {
    throw error(500, e.message);
  }
  return new Response();
};
