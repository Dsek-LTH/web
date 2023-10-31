import { getUserApis } from "$lib/utils/access";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  const accessPolicies = await getUserApis(session?.user);
  return {
    session,
    accessPolicies,
  };
};
