import { api } from "$lib/api/client";
import { getEventCommitteeOptions } from "$lib/events/committees";
import { actionType, eventSchema } from "$lib/events/schema";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
  const { member } = await parent();
  if (!member) error(401, "Du måste vara inloggad för att skapa evenemang.");

  const [tagsRes, committees] = await Promise.all([
    api.GET("/tags", { fetch }),
    getEventCommitteeOptions(fetch),
  ]);
  if (tagsRes.error)
    error(
      tagsRes.response.status,
      tagsRes.error.detail ?? "Failed to load tags",
    );

  return {
    allTags: tagsRes.data ?? [],
    committees,
    // Same schema as the edit page: EventForm always reads/writes
    // editType, even though creating never asks for it.
    form: await superValidate(
      { editType: "THIS" as const },
      zod4(eventSchema.and(z.object({ editType: actionType }))),
    ),
  };
};
