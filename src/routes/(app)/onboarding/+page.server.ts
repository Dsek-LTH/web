import { memberSchema } from "$lib/zod/schemas";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";

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
    throw error(404, "Member not found");
  }
  const member = memberResult.value;
  return {
    form: await superValidate(member, memberSchema),
    member,
  };
};

const updateSchema = memberSchema.pick({
  firstName: true,
  lastName: true,
  nickname: true,
  foodPreference: true,
  classProgramme: true,
  classYear: true,
});

export type UpdateSchema = typeof updateSchema;

export const actions: Actions = {
  update: async ({ locals, request, cookies }) => {
    const { prisma } = locals;
    const form = await superValidate(request, updateSchema);
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
      throw error(500, "Could not find student-id");
    }
    return redirect(
      "/",
      { type: "success", message: "Member updated" },
      cookies,
    );
  },
};
