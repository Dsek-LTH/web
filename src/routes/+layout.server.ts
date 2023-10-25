import { getUserApis } from "$lib/utils/access";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  const session = await event.locals.getSession();
  const accessPolicies = await getUserApis(session?.user);
  return {
    session,
    accessPolicies,
  };
};
