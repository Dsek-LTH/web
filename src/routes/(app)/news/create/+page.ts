import { api } from "$lib/api/client";
import { createSchema } from "$lib/news/schema";
import { buildAuthorOptions } from "$lib/news/authorOptions";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
  const { member } = await parent();
  if (!member) throw error(500, m.news_errors_memberNotFound());

  const [mandatesRes, customAuthorsRes, committeesRes, tagsRes] =
    await Promise.all([
      api.GET("/members/{id}/mandates", {
        fetch,
        params: { path: { id: member.id } },
      }),
      api.GET("/custom-authors", { fetch }),
      api.GET("/committees", { fetch }),
      api.GET("/tags", { fetch }),
    ]);
  if (
    mandatesRes.error ||
    customAuthorsRes.error ||
    committeesRes.error ||
    tagsRes.error
  ) {
    throw error(500, "Failed to load author/committee/tag options");
  }

  const self = {
    id: member.id,
    studentId: member.studentId ?? undefined,
    firstName: member.firstName ?? undefined,
    lastName: member.lastName ?? undefined,
    nickname: member.nickname ?? undefined,
    picturePath: member.picturePath ?? undefined,
  };
  const authorOptions = buildAuthorOptions(
    self,
    mandatesRes.data ?? [],
    customAuthorsRes.data ?? [],
  );

  return {
    allTags: tagsRes.data ?? [],
    authorOptions,
    form: await superValidate(
      {
        sendNotification: true,
        author: authorOptions[0],
      },
      zod4(createSchema),
      { errors: false },
    ),
    committees: committeesRes.data ?? [],
  };
};
