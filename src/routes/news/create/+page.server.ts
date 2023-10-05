import { accessGuard } from "$lib/access";
import apiNames from "$lib/apiNames";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = await event.locals.getSession();
  await accessGuard(apiNames.NEWS.CREATE, session?.user);
};
