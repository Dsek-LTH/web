import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { loadHomeData } from "$lib/server/loadHomeData";
import { APP_PREFERRED_PAGE_COOKIE } from "$lib/components/postReveal/types";

export const load: PageServerLoad = async ({ locals, fetch, cookies }) => {
  if (locals.isApp)
    cookies.set(APP_PREFERRED_PAGE_COOKIE, "dsek", {
      path: "/",
    });
  if (!locals.user?.memberId) {
    redirect(302, "/");
  }
  return await loadHomeData({ locals, fetch });
};
