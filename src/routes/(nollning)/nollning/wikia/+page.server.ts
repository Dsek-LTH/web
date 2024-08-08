import { redirect } from "$lib/utils/redirect";
import { POST_REVEAL_PREFIX } from "../routes";

export const load = async () => {
  throw redirect(308, `${POST_REVEAL_PREFIX}/wikia/staben`);
};
