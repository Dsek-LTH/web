import apiNames from "$lib/utils/apiNames";
import { authorise } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { user } }) => {
  authorise(apiNames.EXPENSES.CREATE, user);
};
