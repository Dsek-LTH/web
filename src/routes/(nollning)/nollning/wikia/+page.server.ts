import { redirect } from "@sveltejs/kit";
import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types";

export const load = async () => {
  throw redirect(302, `${POST_REVEAL_PREFIX}/wikia/map`);
};
