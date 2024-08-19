import { redirect } from "$lib/utils/redirect";
import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types";

export const load = async () => {
  throw redirect(308, `${POST_REVEAL_PREFIX}/wikia/staben`);
};
