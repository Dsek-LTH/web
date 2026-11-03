import { memberSchema } from "$lib/zod/schemas";
import { serverApi } from "$lib/server/apiClient";
import * as m from "$paraglide/messages";
import { error, fail, redirect, type NumericRange } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { setNollningGroup } from "$lib/utils/member";

// Server-only load, not +page.ts - a documented exception (see the profile
// view page's own comment): `phadderGroups` isn't part of the Go member
// API itself, so this can't move to a universal load.
export const load: PageServerLoad = async (event) => {
  const { params } = event;
  const api = serverApi(event);
  const { studentId } = params;

  const [memberRes, phadderGroupsResult, currentNollningResult] =
    await Promise.allSettled([
      api.GET("/members/{studentId}", {
        params: { path: { studentId } },
      }),
      api.GET("/nollning/groups", {}),
      api.GET("/nollning/current", {}),
    ]);
  if (memberRes.status === "rejected")
    error(500, m.members_errors_couldntFetchMember());
  if (memberRes.value.error)
    error(
      memberRes.value.response.status,
      memberRes.value.response.status === 404
        ? m.members_errors_memberNotFound()
        : m.members_errors_couldntFetchMember(),
    );
  if (
    phadderGroupsResult.status === "rejected" ||
    phadderGroupsResult.value.error
  )
    throw error(500, "Failed to fetch phadder groups");
  if (
    currentNollningResult.status === "rejected" ||
    currentNollningResult.value.error
  )
    throw error(500, "Failed to fetch current nollning season");

  const profile = memberRes.value.data;
  if (!profile) throw error(404, m.members_errors_memberNotFound());

  try {
    return {
      form: await superValidate(profile, zod4(memberSchema)),
      viewedMember: profile, // https://github.com/Dsek-LTH/web/issues/194
      phadderGroups: phadderGroupsResult.value.data ?? [],
      currentSeasonId: currentNollningResult.value.data?.season?.id ?? null,
    };
  } catch {
    throw error(500, m.members_errors_couldntFetchPings());
  }
};

const updateSchema = memberSchema
  .pick({
    firstName: true,
    lastName: true,
    nickname: true,
    foodPreference: true,
    classProgramme: true,
    classYear: true,
    graduationYear: true,
    nollningGroupId: true,
    language: true,
    bio: true,
  })
  .partial();

export type UpdateSchema = Infer<typeof updateSchema>;

export const actions: Actions = {
  update: async (event) => {
    const { params, request } = event;
    const api = serverApi(event);
    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;
    const { nollningGroupId, foodPreference, ...profileFields } = form.data;

    const res = await api.PATCH("/members/{studentId}", {
      params: { path: { studentId } },
      body: {
        firstName: profileFields.firstName ?? "",
        lastName: profileFields.lastName ?? "",
        nickname: profileFields.nickname ?? undefined,
        classProgramme: profileFields.classProgramme ?? undefined,
        classYear: profileFields.classYear ?? undefined,
        graduationYear: profileFields.graduationYear ?? undefined,
        language: profileFields.language ?? undefined,
        bio: profileFields.bio ?? undefined,
      },
    });
    if (foodPreference !== undefined) {
      await api.PATCH("/members/{studentId}/food-preference", {
        params: { path: { studentId } },
        body: { foodPreference: foodPreference ?? undefined },
      });
    }
    if (res.error)
      return message(
        form,
        { message: m.members_errors_couldntFetchMember(), type: "error" },
        { status: res.response.status as NumericRange<400, 599> },
      );

    await setNollningGroup(api, studentId, nollningGroupId ?? null);

    throw redirect(302, `/members/${params.studentId}`);
  },
};
