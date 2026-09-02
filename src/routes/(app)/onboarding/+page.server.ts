import { memberSchema } from "$lib/zod/schemas";
import { serverApi } from "$lib/server/apiClient";
import { superValidate, type Infer } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "./$types";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";
import { setNollningGroup } from "$lib/utils/member";

export const load: PageServerLoad = async (event) => {
  const { locals } = event;
  const api = serverApi(event);
  const studentId = locals.user?.studentId;
  if (!studentId) redirect(302, "/");

  const [memberRes, phadderGroupsResult, currentNollningResult] =
    await Promise.allSettled([
      api.GET("/members/{studentId}", {
        params: { path: { studentId } },
      }),
      api.GET("/nollning/groups", {}),
      api.GET("/nollning/current", {}),
    ]);
  if (memberRes.status === "rejected" || memberRes.value.error) {
    redirect(302, "/");
  }
  const profile = memberRes.value.data;
  if (!profile) {
    throw error(404, m.onboarding_errors_memberNotFound());
  }
  if (phadderGroupsResult.status === "rejected" || phadderGroupsResult.value.error)
    throw error(500, "Couldn't fetch phadder groups");
  if (
    currentNollningResult.status === "rejected" ||
    currentNollningResult.value.error
  )
    throw error(500, "Couldn't fetch current nollning season");
  const phadderGroups = phadderGroupsResult.value.data ?? [];
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
    currentSeasonId: currentNollningResult.value.data?.season?.id ?? null,
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
  update: async (event) => {
    const { locals, request, cookies } = event;
    const api = serverApi(event);
    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    const studentId = locals.user?.studentId;
    if (!studentId) {
      throw error(500, m.onboarding_errors_studentIDNotFound());
    }

    const { email, nollningGroupId, foodPreference, ...profileFields } =
      form.data;

    const profileRes = await api.PATCH("/members/{studentId}", {
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
        params: { path: { studentId } },
        body: { foodPreference },
      });
    }

    // email isn't part of the Go member API yet - real auth already sets
    // it from Authentik claims at first login, see DESIGN.md's Auth
    // section, so this form field may already be redundant (not confirmed
    // yet). Narrow, explicit, temporary direct write, not a broader Prisma
    // bridge for the rest of the (now Go-backed) member domain.
    await locals.prisma.member.update({
      where: { studentId },
      data: { email },
    });
    await setNollningGroup(api, studentId, nollningGroupId ?? null);

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
