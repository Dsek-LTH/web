import { requirePolicy } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import type { PageLoad } from "./$types";

// The song itself comes from the layout; this only answers 401/403 to
// someone who couldn't save it.
export const load: PageLoad = async ({ parent }) => {
  requirePolicy((await parent()).user, apiNames.SONG.UPDATE);
};
