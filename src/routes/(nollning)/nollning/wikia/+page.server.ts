import { redirect } from "$lib/utils/redirect";
import { POST_REVEAL_PREFIX } from "$lib/components/postReveal/types";

export const load = async ({ parent }) => {
  const { revealTheme } = await parent();
  if (revealTheme) throw redirect(302, `${POST_REVEAL_PREFIX}/wikia/map`);
  throw redirect(302, `${POST_REVEAL_PREFIX}/wikia/sektionen`);
};
