import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { redirect } from "$lib/utils/redirect";
import { electionSchema } from "../../schemas";
import * as m from "$paraglide/messages";
import dayjs from "dayjs";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;
  const electionPromise = prisma.election.findFirst({
    where: { id: params.id },
  });

  const committees = await prisma.committee.findMany({
    orderBy: [{ shortName: "asc" }],
    select: {
      id: true,
      name: true,
      nameEn: true,
    },
  });

  const election = await electionPromise;

  if (!election) {
    throw error(404, m.elections_notFound());
  }

  return {
    election,
    committees,
    form: await superValidate(
      {
        ...election,
        expiresAt: dayjs(election.expiresAt).format("YYYY-MM-DD"),
      },
      zod(electionSchema),
    ),
  };
};

export const actions: Actions = {
  update: async (event) => {
    const { request, locals, params } = event;
    const { prisma } = locals;
    const form = await superValidate(request, zod(electionSchema));
    if (!form.valid) return fail(400, { form });
    const id = params.id;
    const { markdown, markdownEn, link, expiresAt, committeeId } = form.data;
    await prisma.election.update({
      where: {
        id,
      },
      data: {
        markdown,
        markdownEn,
        link,
        expiresAt: dayjs(expiresAt).endOf("day").toDate(),
        committeeId,
      },
    });
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
