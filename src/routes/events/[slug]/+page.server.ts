import { getEvent } from "../events";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { hasAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";

export const load: PageServerLoad = async ({ params, parent }) => {
  const event = await getEvent(params.slug);
  if (event == undefined) {
    throw error(404, {
      message: "Not found",
    });
  }
  const { session } = await parent();
  const canEdit = await hasAccess(apiNames.EVENT.UPDATE, session?.user, event.author.id);
  return {
    event,
    canEdit,
  };
};
