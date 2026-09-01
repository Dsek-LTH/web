import { memberSchema } from "$lib/zod/schemas";
import { api } from "$lib/api/client";
import { superValidate, type Infer } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";

// Server-only load, not +page.ts - `phadderGroups` isn't part of the Go
// member API yet (Phase 2 nollning redesign, see DESIGN.md's roadmap).
export const load: PageServerLoad = async ({ locals, fetch }) => {
  const studentId = locals.user?.studentId;
  if (!studentId) redirect(302, "/");

  const [memberRes, phadderGroupsResult] = await Promise.allSettled([
    api.GET("/members/{studentId}", { fetch, params: { path: { studentId } } }),
    locals.prisma.phadderGroup.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  if (memberRes.status === "rejected" || memberRes.value.error) {
    redirect(302, "/");
  }
  const profile = memberRes.value.data;
  if (!profile) {
    throw error(404, m.onboarding_errors_memberNotFound());
  }
  if (phadderGroupsResult.status === "rejected")
    throw error(
      500,
      phadderGroupsResult.reason ?? "Couldn't fetch phadder groups",
    );
  const phadderGroups = phadderGroupsResult.value;
  return {
    form: await superValidate(
      {
        ...profile,
        classProgramme: profile.classProgramme,
        classYear: profile.classYear ?? new Date().getFullYear(),
      },
      zod4(memberSchema),
    ),
    member: profile,
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

export type UpdateSchema = Infer<typeof updateSchema>;

export const actions: Actions = {
  update: async ({ locals, fetch, request, cookies }) => {
    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    const studentId = locals.user?.studentId;
    if (!studentId) {
      throw error(500, m.onboarding_errors_studentIDNotFound());
    }

    const { email, nollningGroupId, foodPreference, ...profileFields } =
      form.data;

    const profileRes = await api.PATCH("/members/{studentId}", {
      fetch,
      params: { path: { studentId } },
      body: {
        firstName: profileFields.firstName ?? "",
        lastName: profileFields.lastName ?? "",
        nickname: profileFields.nickname ?? undefined,
        classProgramme: profileFields.classProgramme ?? undefined,
        classYear: profileFields.classYear ?? undefined,
      },
    });
    if (profileRes.error) {
      throw error(500, m.onboarding_errors_studentIDNotFound());
    }
    if (foodPreference !== null) {
      await api.PATCH("/members/{studentId}/food-preference", {
        fetch,
        params: { path: { studentId } },
        body: { foodPreference },
      });
    }

    // email/nollningGroupId aren't part of the Go member API yet (email:
    // real auth already sets it from Authentik claims at first login, see
    // DESIGN.md's Auth section - this form field may already be redundant,
    // not confirmed yet; nollningGroupId: owned by the Phase 2 nollning
    // redesign). Narrow, explicit, temporary direct write, not a broader
    // Prisma bridge for the rest of the (now Go-backed) member domain.
    await locals.prisma.member.update({
      where: { studentId },
      data: { email, nollningGroupId },
    });

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
