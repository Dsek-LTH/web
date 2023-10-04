import { getUserApis } from "$lib/access";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  const session = await event.locals.getSession();
  const apiAccessPolicies = await getUserApis(session?.user);
  return {
    session,
    apiAccessPolicies,
  };
};
