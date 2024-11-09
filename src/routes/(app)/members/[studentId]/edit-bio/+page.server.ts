import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import { memberSchema } from "$lib/zod/schemas";
import { error, fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import DOMPurify from "isomorphic-dompurify";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  if (user?.studentId !== params.studentId) {
    authorize(apiNames.MEMBER.UPDATE, user);
  }

  const member = await prisma.member.findUnique({
    where: {
      studentId: params.studentId,
    },
  });
  if (!member) {
    throw error(404, m.members_errors_memberNotFound());
  }
  return {
    member,
    form: await superValidate(member, zod(updateBioSchema)),
  };
};

const updateBioSchema = memberSchema.pick({ bio: true });

export const actions: Actions = {
  update: async (event) => {
    const { request, locals, params } = event;
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateBioSchema));
    if (!form) return fail(400, { form });
    const studentId = params.studentId;
    await prisma.member.update({
      where: { studentId },
      data: {
        bio: form.data.bio ? DOMPurify.sanitize(form.data.bio) : form.data.bio,
      },
    });
    throw redirect(
      `/members/${studentId}`,
      {
        message: m.members_bioUpdated(),
        type: "success",
      },
      event,
    );
  },
};
