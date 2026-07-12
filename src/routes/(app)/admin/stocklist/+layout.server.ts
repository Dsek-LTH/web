import type { LayoutServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";

export const load: LayoutServerLoad = async (event) => {
  const { user } = event.locals;
  authorize(apiNames.DRINKITEM.READ, user);
};
