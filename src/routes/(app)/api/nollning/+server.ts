import type { RequestHandler } from "./$types";
import { isNollningPeriod } from "$lib/utils/adminSettings/nollning";

export const GET: RequestHandler = async () => {
	return new Response(JSON.stringify(await isNollningPeriod()));
};
