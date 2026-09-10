import type { LayoutServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

export const load: LayoutServerLoad = async ({ locals }) => {
  authorize(apiNames.DRINKITEM.READ, locals.user);
};
