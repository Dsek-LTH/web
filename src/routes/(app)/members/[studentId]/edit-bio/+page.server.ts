import apiNames from "$lib/utils/apiNames";
import { memberSchema } from "$lib/zod/schemas";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { redirect } from "$lib/utils/redirect";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  if (!user || !user.memberId) throw redirect(302, "/home");

  const member = await prisma.member.findUnique({
    where: {
      studentId: params.studentId,
    },
  });
  if (!member) {
    throw error(404, "Member not found");
  }
  return {
    member,
    form: await superValidate(member, updateBioSchema),
  };
};

const updateBioSchema = memberSchema.pick({ bio: true });

export const actions: Actions = {
  update: async ({ params, locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(request, updateBioSchema);
    if (!form) return fail(400, { form });
    const studentId = params.studentId;
    await prisma.member.update({
      where: { studentId },
      data: {
        bio: form.data.bio,
      },
    });
    return message(form, {
      message: "Bio uppdaterad",
      type: "success",
    });
  },
};
