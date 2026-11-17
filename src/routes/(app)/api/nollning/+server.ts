import type { RequestHandler } from "./$types";
import { isN0llningPeriod } from "$lib/utils/adminSettings/nollning";

export const GET: RequestHandler = async () => {
  return new Response(JSON.stringify(await isN0llningPeriod()));
};
