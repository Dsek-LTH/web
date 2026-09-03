import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { redirect } from "sveltekit-flash-message/server";
import { electionSchema } from "../../schemas";
import * as m from "$paraglide/messages";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { serverApi } from "$lib/server/apiClient";

dayjs.extend(utc);
dayjs.extend(timezone);

// election:update is enforced by the Go API itself - same "old app had no
// explicit check" note as the create page's action.
export const load: PageServerLoad = async (event) => {
  const { params } = event;

  const [electionRes, committeesRes] = await Promise.all([
    serverApi(event).GET("/elections/{id}", {
      params: { path: { id: params.id } },
    }),
    serverApi(event).GET("/committees", {}),
  ]);

  if (electionRes.error) {
    throw error(404, m.elections_notFound());
  }
  const election = electionRes.data;
  const committees = committeesRes.data ?? [];

  return {
    election,
    committees,
    form: await superValidate(
      {
        markdownSv: election.markdownSv,
        markdownEn: election.markdownEn ?? null,
        link: election.link,
        committeeId: election.committeeId,
        expiresAt: dayjs(election.expiresAt).format("YYYY-MM-DD"),
      },
      zod4(electionSchema),
    ),
  };
};

export const actions: Actions = {
  update: async (event) => {
    const { request, params } = event;
    const form = await superValidate(request, zod4(electionSchema));
    if (!form.valid) return fail(400, { form });
    const { markdownSv, markdownEn, link, expiresAt, committeeId } = form.data;
    const updated = await serverApi(event).PATCH("/elections/{id}", {
      params: { path: { id: params.id } },
      body: {
        markdownSv,
        markdownEn: markdownEn ?? undefined,
        link,
        expiresAt: dayjs
          .tz(`${expiresAt} 23:59:59`, "Europe/Stockholm")
          .utc()
          .toISOString(),
        committeeId,
      },
    });
    if (updated.error) throw new Error("Failed to update election");
    throw redirect(
      "/elections",
      {
        message: m.elections_updated(),
        type: "success",
      },
      event,
    );
  },
};
