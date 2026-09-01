import { api } from "$lib/api/client";
import { eventSchema } from "$lib/events/schema";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
  const { member } = await parent();
  if (!member) error(401, "Du måste vara inloggad för att skapa evenemang.");

  const tagsRes = await api.GET("/tags", { fetch });
  if (tagsRes.error) throw error(500, "Failed to load tags");

  return {
    allTags: tagsRes.data ?? [],
    form: await superValidate(
      { organizer: `${member.firstName} ${member.lastName}` },
      zod4(eventSchema),
    ),
  };
};
