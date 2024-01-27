import { ctxAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import { memberSchema } from "$lib/zod/schemas";
import { error, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params, parent }) => {
  const { prisma } = locals;
  const member = await prisma.member.findUnique({
    where: {
      studentId: params.studentId,
    },
  });
  if (!member) {
    throw error(404, "Member not found");
  }
  const { session } = await parent();
  await ctxAccessGuard(apiNames.MEMBER.UPDATE, session?.user, {
    studentId: params.studentId,
  });
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
    const session = await locals.getSession();
    const studentId = params.studentId;
    return withAccess(
      apiNames.MEMBER.UPDATE,
      session?.user,
      async () => {
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
      form,
      { studentId },
    );
  },
};
