import { accessGuard } from "$lib/access";
import apiNames from "$lib/apiNames";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const { accessPolicies } = await parent();
  accessGuard(apiNames.NEWS.CREATE, accessPolicies);
};
