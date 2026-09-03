import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { redirect } from "sveltekit-flash-message/server";
import { electionSchema } from "../schemas";
import * as m from "$paraglide/messages";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { serverApi } from "$lib/server/apiClient";

dayjs.extend(utc);
dayjs.extend(timezone);

// election:create is enforced by the Go API itself - a real, necessary
// explicit check Go adds that the old app's action never had (it relied
// purely on ZenStack's model-level policy, with no fallback for a
// Go-backed world).
export const load: PageServerLoad = async (event) => {
  const res = await serverApi(event).GET("/committees", {});
  if (res.error) throw new Error("Failed to load committees");
  const committees = res.data ?? [];

  const election = {
    markdownSv: "",
    markdownEn: null,
    link: "",
    expiresAt: dayjs().endOf("day").utc().toDate(),
    committeeId: "",
  };

  return {
    committees,
    election,
    form: await superValidate(zod4(electionSchema)),
  };
};

export const actions: Actions = {
  create: async (event) => {
    const { request } = event;
    const form = await superValidate(request, zod4(electionSchema));
    if (!form.valid) return fail(400, { form });
    const { markdownSv, markdownEn, link, expiresAt, committeeId } = form.data;
    const created = await serverApi(event).POST("/elections", {
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
    if (created.error) throw new Error("Failed to create election");
    throw redirect(
      "/elections",
      {
        message: m.elections_created(),
        type: "success",
      },
      event,
    );
  },
};
