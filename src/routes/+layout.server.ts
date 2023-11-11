import { getUserApis } from "$lib/utils/access";
import { getCurrentMember } from "$lib/utils/member";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  const accessPolicies = await getUserApis(session?.user);
  const currentMember = getCurrentMember(session?.user);
  return {
    session,
    accessPolicies,
    currentMember,
  };
};
