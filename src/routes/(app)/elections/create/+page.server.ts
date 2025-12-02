import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { redirect } from "$lib/utils/redirect";
import { electionSchema } from "../schemas";
import * as m from "$paraglide/messages";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;

  const committees = await prisma.committee.findMany({
    orderBy: [{ shortName: "asc" }],
    select: {
      id: true,
      name: true,
      nameSv: true,
      nameEn: true,
    },
  });

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
    form: await superValidate(zod(electionSchema)),
  };
};

export const actions: Actions = {
  create: async (event) => {
    const { request, locals } = event;
    const { prisma } = locals;
    const form = await superValidate(request, zod(electionSchema));
    if (!form.valid) return fail(400, { form });
    const { markdownSv, markdownEn, link, expiresAt, committeeId } = form.data;
    await prisma.election.create({
      data: {
        markdownSv,
        markdownEn,
        link,
        expiresAt: dayjs
          .tz(`${expiresAt} 23:59:59`, "Europe/Stockholm")
          .utc()
          .toDate(),
        committeeId,
      },
    });
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
