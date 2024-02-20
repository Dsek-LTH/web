import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  const { user } = event.locals;
  authorize(apiNames.EMAIL_ALIAS.READ, user);
};
