import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { user } }) => {
  authorize(apiNames.EXPENSES.CREATE, user);
};
