import type { RequestHandler } from "./$types";
import { isIntroductionPeriod } from "$lib/utils/adminSettings/introduction";

export const GET: RequestHandler = async () => {
  return new Response(JSON.stringify(await isIntroductionPeriod()));
};
