import { memberSchema } from "$lib/zod/schemas";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import authentik from "$lib/server/authentik";
import type { z } from "zod";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const [memberResult, phadderGroupsResult] = await Promise.allSettled([
    prisma.member.findUnique({
      where: {
        studentId: locals.user?.studentId,
      },
    }),
    prisma.phadderGroup.findMany({
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);
  if (memberResult.status === "rejected") {
    redirect(302, "/");
  }
  if (!memberResult.value) {
    throw error(404, m.onboarding_errors_memberNotFound());
  }
  if (phadderGroupsResult.status === "rejected")
    throw error(
      500,
      phadderGroupsResult.reason ?? "Couldn't fetch phadder groups",
    );
  const member = memberResult.value;
  const phadderGroups = phadderGroupsResult.value;
  return {
    form: await superValidate(
      {
        ...member,
        classProgramme: member.classProgramme ?? "D",
        classYear: member.classYear ?? new Date().getFullYear(),
      },
      zod(memberSchema),
    ),
    member,
    phadderGroups,
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
  nollningGroupId: true,
});

export type UpdateSchema = z.infer<typeof updateSchema>;

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
    authentik.updateProfile(
      studentId,
      form.data.firstName ?? "",
      form.data.lastName ?? "",
    );
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
