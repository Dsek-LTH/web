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
      api.GET("/nollning/phadder-groups", {}),
      api.GET("/nollning/current", {}),
    ]);
  if (memberRes.status === "rejected" || memberRes.value.error) {
    redirect(302, "/");
  }
  const profile = memberRes.value.data;
  if (!profile) {
    throw error(404, m.onboarding_errors_memberNotFound());
  }
  if (
    phadderGroupsResult.status === "rejected" ||
    phadderGroupsResult.value.error
  )
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

// Only include fields that are submitted by the form. Missing fields are
// parsed as null and would overwrite existing data, e.g. the email address
// which is set from Authentik when the member is created.
const updateSchema = memberSchema.pick({
  firstName: true,
  lastName: true,
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

    const { nollningGroupId, foodPreference, ...profileFields } = form.data;

    // Go's member update replaces every profile field, so the ones this
    // form doesn't submit (nickname, bio, ...) are carried over from the
    // current profile rather than cleared - upstream's #1342 fix, which
    // stops onboarding from overwriting fields it doesn't show. Email isn't
    // part of the form or this update at all; it comes from Authentik.
    const currentRes = await api.GET("/members/{studentId}", {
      params: { path: { studentId } },
    });
    if (currentRes.error) {
      throw error(500, m.onboarding_errors_studentIDNotFound());
    }
    const current = currentRes.data;
    const profileRes = await api.PUT("/members/{studentId}", {
      params: { path: { studentId } },
      body: {
        firstName: profileFields.firstName ?? "",
        lastName: profileFields.lastName ?? "",
        nickname: current.nickname,
        classProgramme: profileFields.classProgramme ?? undefined,
        classYear: profileFields.classYear ?? undefined,
        graduationYear: current.graduationYear,
        language: current.language,
        bio: current.bio,
      },
    });
    if (profileRes.error) {
      throw error(500, m.onboarding_errors_studentIDNotFound());
    }
    if (foodPreference !== null) {
      await api.PUT("/members/{studentId}/food-preference", {
        params: { path: { studentId } },
        body: { foodPreference },
      });
    }

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
