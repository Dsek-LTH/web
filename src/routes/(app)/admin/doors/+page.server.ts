import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const { user } = locals;
  authorize(apiNames.DOOR.READ, user);
};
