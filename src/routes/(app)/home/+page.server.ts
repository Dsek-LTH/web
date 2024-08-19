import { redirect } from "$lib/utils/redirect";
import type { PageServerLoad } from "./$types";
import { loadHomeData } from "$lib/server/loadHomeData";

export const load: PageServerLoad = async ({ locals, fetch }) => {
  if (!locals.user?.memberId) {
    redirect(302, "/");
  }
  return await loadHomeData({ locals, fetch });
};
