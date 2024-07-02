import { loadHomeData } from "$lib/server/loadHomeData";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, fetch }) => {
  return await loadHomeData({ locals, fetch });
};
