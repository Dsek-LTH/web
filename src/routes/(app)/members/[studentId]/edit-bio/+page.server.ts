import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { memberSchema } from "$lib/zod/schemas";
import { error, fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { redirect } from "sveltekit-flash-message/server";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.MEMBER.UPDATE, user);

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
  update: async (event) => {
    const { request, locals, params } = event;
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
    throw redirect(
      `/members/${studentId}`,
      {
        message: "Bio updated",
        type: "success",
      },
      event,
    );
  },
};
