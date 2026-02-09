// THIS FILE IS ONLY TO BE USED BY THE NATIVE APP
// What it does is handles which version of the app is "saved", ie when I open the app, should I go to /nollning or /home

import { APP_PREFERRED_PAGE_COOKIE } from "$lib/components/postReveal/types";
import { redirect } from "$lib/utils/redirect";

export const load = async ({ locals, cookies }) => {
  if (!locals.isApp) {
    redirect(302, "/");
  }
  if (cookies.get(APP_PREFERRED_PAGE_COOKIE) === "nollning") {
    return {
      redirect: "/nollning",
    } as const;
  } else {
    return {
      redirect: "/app/home",
    } as const;
  }
};
