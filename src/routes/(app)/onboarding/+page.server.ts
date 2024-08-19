import { memberSchema } from "$lib/zod/schemas";
import { superValidate, type Infer } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const [memberResult] = await Promise.allSettled([
    prisma.member.findUnique({
      where: {
        studentId: locals.user?.studentId,
      },
    }),
  ]);
  if (memberResult.status === "rejected") {
    redirect(302, "/");
  }
  if (!memberResult.value) {
    throw error(404, m.onboarding_errors_memberNotFound());
  }
  const member = memberResult.value;
  return {
    form: await superValidate(member, zod(memberSchema)),
    member,
  };
};

const updateSchema = memberSchema.pick({
  email: true,
  firstName: true,
  lastName: true,
  nickname: true,
  foodPreference: true,
  classProgramme: true,
  classYear: true,
});

export type UpdateSchema = Infer<typeof updateSchema>;

export const actions: Actions = {
  update: async ({ locals, request, cookies }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateSchema));
    if (!form.valid) return fail(400, { form });
    const studentId = locals.user?.studentId;
    if (studentId) {
      await prisma.member.update({
        where: { studentId },
        data: {
          ...form.data,
        },
      });
    } else {
      throw error(500, m.onboarding_errors_studentIDNotFound());
    }
    return redirect(
      "/",
      {
        type: "success",
        message: m.onboarding_memberUpdated(),
      },
      cookies,
    );
  },
};
