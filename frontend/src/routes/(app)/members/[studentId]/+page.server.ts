import { serverApi } from "$lib/server/apiClient";
import { setNollningGroup } from "$lib/utils/member";
import { emptySchema, memberSchema } from "$lib/zod/schemas";
import * as m from "$paraglide/messages";
import { getLocale } from "$paraglide/runtime";
import { error, fail, type NumericRange } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { formatBirthday, toBirthDateString } from "$lib/utils/birthdays";

export const load: PageServerLoad = async (event) => {
  const { locals, params, cookies } = event;
  const api = serverApi(event);
  const { user } = locals;
  const { studentId } = params;

  const [
    memberRes,
    publishedArticlesResult,
    phadderGroupsResult,
    phadderRoleResult,
    currentNollningResult,
    seasonsResult,
    medalsResult,
  ] = await Promise.allSettled([
    api.GET("/members/{studentId}", {
      params: { path: { studentId } },
    }),
    // Fetches 5 and filters out Custom-byline articles client-side rather
    // than server-side (the Go API's authorStudentId filter matches on
    // the underlying member regardless of byline type, since a custom
    // byline still has a real member behind it) - this can under-fill to
    // fewer than 5 on a profile with several custom-authored articles,
    // which is an acceptable trade for not widening the Go API's filter
    // surface for this one profile-page widget.
    api
      .GET("/articles", {
        params: { query: { authorStudentId: studentId, pageSize: 5 } },
      })
      .then(
        (res) =>
          res.data?.articles?.filter(
            (article) => article.author.type !== "Custom",
          ) ?? [],
      ),
    api.GET("/nollning/phadder-groups", {}),
    api.GET("/members/{studentId}/phadder-role", {
      params: { path: { studentId } },
    }),
    api.GET("/nollning/current", {}),
    api.GET("/nollning/seasons", {}),
    api.GET("/members/{studentId}/medals", {
      params: { path: { studentId } },
    }),
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
  if (publishedArticlesResult.status === "rejected")
    throw error(500, m.members_errors_couldntFetchArticles());
  if (
    phadderGroupsResult.status === "rejected" ||
    phadderGroupsResult.value.error
  )
    throw error(500, "Failed to fetch phadder groups");
  if (phadderRoleResult.status === "rejected" || phadderRoleResult.value.error)
    throw error(500, "Failed to fetch phadder role");
  if (
    currentNollningResult.status === "rejected" ||
    currentNollningResult.value.error
  )
    throw error(500, "Failed to fetch current nollning season");
  if (seasonsResult.status === "rejected" || seasonsResult.value.error)
    throw error(500, "Failed to fetch nollning seasons");
  if (medalsResult.status === "rejected" || medalsResult.value.error)
    throw error(500, "Failed to fetch medals");

  const profile = memberRes.value.data;
  if (!profile) throw error(404, m.members_errors_memberNotFound());

  const phadderGroups = phadderGroupsResult.value.data ?? [];
  const seasons = seasonsResult.value.data ?? [];
  const phadderRole = phadderRoleResult.value.data;
  const nollaGroupId =
    phadderRole?.role === "nolla" ? (phadderRole.groupId ?? null) : null;
  // The full display object the profile page needs ({name, imageUrl,
  // year}), not just the bare id - the old Prisma shape (member.nollaIn as
  // the PhadderGroup relation object) is reconstructed from the already-
  // fetched groups/seasons lists rather than a third round-trip.
  const nollaGroup = phadderGroups.find((g) => g.id === nollaGroupId);
  const nollaSeason = seasons.find((s) => s.id === nollaGroup?.seasonId);
  const nollaIn =
    nollaGroup && nollaSeason
      ? {
          id: nollaGroup.id,
          name: nollaGroup.name,
          imageUrl: nollaGroup.imageUrl ?? null,
          year: nollaSeason.year,
        }
      : null;

  const birthday = profile.birthDate
    ? formatBirthday(new Date(profile.birthDate), getLocale())
    : null;

  const member = {
    ...profile,
    mandates: (profile.mandates ?? []).map((mandate) => ({
      ...mandate,
      startDate: new Date(mandate.startDate!),
      endDate: new Date(mandate.endDate!),
    })),
    nollaIn,
  };

  // Go's MemberAccess itself only ever returns real data for the caller's
  // own studentId (empty otherwise) - the member.id check here just skips
  // the network round-trip entirely when viewing someone else's profile,
  // not a duplicated authorization decision (Principle #5).
  const doorAccess =
    member.id === user?.memberId
      ? await api
          .GET("/members/{studentId}/door-access", {
            params: { path: { studentId } },
          })
          .then((res) => res.data ?? [])
      : [];

  const showPhadderGroupModal =
    member.nollaIn === null &&
    cookies.get("phadder_group_modal_skipped") !== "1" &&
    cookies.get("phadder_group_modal_never") !== "1";

  try {
    return {
      form: await superValidate(member, zod4(memberSchema)),
      phadderGroupForm: await superValidate(
        { classYear: member.classYear, nollningGroupId: nollaGroupId },
        zod4(phadderGroupSchema),
      ),
      viewedMember: member, // https://github.com/Dsek-LTH/web/issues/194
      birthday,
      birthdayToday: profile.birthdayToday,
      doorAccess,
      publishedArticles: publishedArticlesResult.value,
      medals: medalsResult.value.data ?? [],
      phadderGroups,
      currentSeasonId: currentNollningResult.value.data?.season?.id ?? null,
      showPhadderGroupModal: showPhadderGroupModal,
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
    birthDate: true,
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

const phadderGroupSchema = memberSchema
  .pick({
    classYear: true,
    nollningGroupId: true,
  })
  .partial()
  .extend({
    skipAction: z.enum(["skip", "never", "none"]).optional().default("none"),
  });
export type PhadderGroupSchema = Infer<typeof phadderGroupSchema>;

export const actions: Actions = {
  updateFoodPreference: async (event) => {
    const { params, request } = event;
    const form = await superValidate(
      request,
      zod4(z.object({ foodPreference: z.string() })),
    );
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;
    const res = await serverApi(event).PUT(
      "/members/{studentId}/food-preference",
      {
        params: { path: { studentId } },
        body: { foodPreference: form.data.foodPreference },
      },
    );
    if (res.error)
      return message(
        form,
        { message: m.members_errors_couldntFetchMember(), type: "error" },
        { status: res.response.status as NumericRange<400, 599> },
      );
    return message(form, {
      message: m.members_memberUpdated(),
      type: "success",
    });
  },
  updatePhadderGroup: async (event) => {
    const { params, request, cookies } = event;
    const form = await superValidate(request, zod4(phadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;

    switch (form.data.skipAction) {
      case "skip":
        cookies.set("phadder_group_modal_skipped", "1", {
          path: "/",
          maxAge: 12 * 60 * 60,
        });
        break;
      case "never":
        cookies.set("phadder_group_modal_never", "1", { path: "/" });
        break;
      default:
        await setNollningGroup(
          serverApi(event),
          studentId,
          form.data.nollningGroupId ?? null,
        );
        break;
    }

    if (form.data.nollningGroupId !== null)
      return message(form, {
        message: m.members_memberUpdated(),
        type: "success",
      });
    else return null;
  },
  update: async (event) => {
    const { params, request } = event;
    const api = serverApi(event);
    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;
    const { nollningGroupId, foodPreference, ...profileFields } = form.data;

    const res = await api.PUT("/members/{studentId}", {
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
        birthDate: toBirthDateString(profileFields.birthDate),
      },
    });
    if (foodPreference !== undefined) {
      await api.PUT("/members/{studentId}/food-preference", {
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

    return message(form, {
      message: m.members_memberUpdated(),
      type: "success",
    });
  },
  ping: async (event) => {
    const form = await superValidate(event.request, zod4(emptySchema));
    const res = await serverApi(event).POST("/members/{studentId}/ping", {
      params: { path: { studentId: event.params.studentId } },
    });
    if (res.error)
      return message(
        form,
        {
          message: m.members_errors_couldntPing({
            e: res.error.detail ?? res.response.statusText,
          }),
          type: "error",
        },
        { status: res.response.status as NumericRange<400, 599> },
      );
    return message(form, {
      message: m.members_pingSent(),
      type: "success",
    });
  },
};
