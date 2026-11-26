import { APP_PREFERRED_PAGE_COOKIE } from "$lib/components/postReveal/types";
import { loadHomeData } from "$lib/server/loadHomeData";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const { locals, cookies } = event;
  if (locals.isApp)
    cookies.set(APP_PREFERRED_PAGE_COOKIE, "dsek", {
      path: "/",
    });
  return await loadHomeData(event);
};
