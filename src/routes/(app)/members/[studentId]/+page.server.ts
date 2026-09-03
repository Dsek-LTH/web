import apiNames from "$lib/utils/apiNames";
import { serverApi } from "$lib/server/apiClient";
import { authorize } from "$lib/utils/authorization";
import { setNollningGroup } from "$lib/utils/member";
import { emptySchema, memberSchema } from "$lib/zod/schemas";
import * as m from "$paraglide/messages";
import { error, fail, isHttpError, type NumericRange } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { z } from "zod";
import { sendPing } from "./pings";
import { dateToSemester } from "$lib/utils/semesters";
import { memberMedals } from "$lib/server/medals/medals";
import { PUBLIC_BUCKETS_MEMBERS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import sharp from "sharp";
import { withFiles } from "sveltekit-superforms/server";
import { v4 as uuid } from "uuid";
import type { Actions, PageServerLoad } from "./$types";
import { deletePictureSchema, uploadPictureSchema } from "./types";
import { removeMyProfilePicture } from "$lib/files/photos/profilePictures";

const PROFILE_PICTURE_PREFIX = (studentId: string) =>
  `public/${studentId}/profile-picture`;

// Server-only load, not +page.ts - a documented exception (see DESIGN.md's
// "Principles going forward"): medals/ping aren't part of the
// directory-foundation port (each belongs to a different, later phase - see
// backend/CLAUDE.md's "Directory routes" section) and are still real
// Prisma lookups, so this can't move to a universal load the way the
// fully-ported fields below could on their own. doorAccess was the last of
// this route's Prisma-backed fields still on the old
// getCurrentDoorPoliciesForMember helper - closed by Phase 10 ("Doors/
// Salto", see backend/CLAUDE.md's "Doors routes" section), now a plain Go
// call like everything else here.
export const load: PageServerLoad = async (event) => {
  const { locals, params, cookies } = event;
  const api = serverApi(event);
  const { prisma, user } = locals;
  const { studentId } = params;

  const [
    memberRes,
    publishedArticlesResult,
    phadderGroupsResult,
    phadderRoleResult,
    currentNollningResult,
    seasonsResult,
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
    api.GET("/nollning/groups", {}),
    api.GET("/members/{studentId}/phadder-role", {
      params: { path: { studentId } },
    }),
    api.GET("/nollning/current", {}),
    api.GET("/nollning/seasons", {}),
  ]);
  if (memberRes.status === "rejected" || memberRes.value.error)
    throw error(500, m.members_errors_couldntFetchMember());
  if (publishedArticlesResult.status === "rejected")
    throw error(500, m.members_errors_couldntFetchArticles());
  if (phadderGroupsResult.status === "rejected" || phadderGroupsResult.value.error)
    throw error(505, "Failed to fetch phadder groups");
  if (phadderRoleResult.status === "rejected" || phadderRoleResult.value.error)
    throw error(505, "Failed to fetch phadder role");
  if (currentNollningResult.status === "rejected" || currentNollningResult.value.error)
    throw error(505, "Failed to fetch current nollning season");
  if (seasonsResult.status === "rejected" || seasonsResult.value.error)
    throw error(505, "Failed to fetch nollning seasons");

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
      ? (await api.GET("/members/{studentId}/door-access", {
          params: { path: { studentId } },
        }).then((res) => res.data ?? []))
      : [];

  const showPhadderGroupModal =
    member.nollaIn === null &&
    cookies.get("phadder_group_modal_skipped") !== "1" &&
    cookies.get("phadder_group_modal_never") !== "1";

  try {
    return {
      form: await superValidate(member, zod4(memberSchema)),
      pingForm: await superValidate(zod4(emptySchema)),
      phadderGroupForm: await superValidate(
        { classYear: member.classYear, nollningGroupId: nollaGroupId },
        zod4(phadderGroupSchema),
      ),
      viewedMember: member, // https://github.com/Dsek-LTH/web/issues/194
      doorAccess,
      publishedArticles: publishedArticlesResult.value ?? [],
      medals: await memberMedals(
        prisma,
        member.id,
        dateToSemester(new Date()) - 1,
      ),
      phadderGroups,
      currentSeasonId: currentNollningResult.value.data?.season?.id ?? null,
      ping: user
        ? await prisma.ping.findFirst({
            where: {
              OR: [
                { fromMemberId: member.id, toMemberId: user.memberId },
                { fromMemberId: user.memberId, toMemberId: member.id },
              ],
            },
          })
        : null,
      showPhadderGroupModal: showPhadderGroupModal,
      uploadForm: await superValidate(zod4(uploadPictureSchema)),
      deleteForm: await superValidate(zod4(deletePictureSchema)),
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
  uploadPicture: async ({ params, locals, request }) => {
    const formData = await request.formData();
    const form = await superValidate(formData, zod4(uploadPictureSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));

    const { image } = form.data;
    const fileName = uuid();
    try {
      const buffer = await sharp(await image.arrayBuffer())
        // this is required to keep the image upright
        .rotate()
        // crop image according to frontend settings
        .extract({
          left: form.data.cropX,
          top: form.data.cropY,
          width: form.data.cropWidth,
          height: form.data.cropHeight,
        })
        // resize to MAX 400x400
        .resize(400, 400, {
          fit: "cover",
          withoutEnlargement: true,
        })
        // save as webp
        .webp()
        .toBuffer();
      const putUrl = await fileHandler.getPresignedPutUrl(
        locals.user,
        PUBLIC_BUCKETS_MEMBERS,
        `${PROFILE_PICTURE_PREFIX(params.studentId)}/${fileName}.webp`,
      );
      const res = await fetch(putUrl, {
        method: "PUT",
        body: buffer,
      });
      if (!res.ok)
        return message(
          form,
          {
            message: `${m.members_errors_couldntUploadFile()}: ${await res.text()}`,
            type: "error",
          },
          { status: 500 },
        );
    } catch (e) {
      console.log(e);
      const errMsg = e instanceof Error ? e.message : String(e);
      return message(
        form,
        {
          message: `${m.members_errors_couldntUploadFile()}: ${errMsg}`,
          type: "error",
        },
        { status: 500 },
      );
    }
    return message(form, {
      message: m.members_pictureUploaded(),
      type: "success",
    });
  },
  deletePicture: async ({ params, locals, request }) => {
    const form = await superValidate(request, zod4(deletePictureSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const fileName = form.data.fileName;
    if (locals.user.studentId === params.studentId) {
      await removeMyProfilePicture(
        `${PROFILE_PICTURE_PREFIX(params.studentId)}/${fileName}`,
        locals.user,
      );
    } else {
      await fileHandler.remove(locals.user, PUBLIC_BUCKETS_MEMBERS, [
        `${PROFILE_PICTURE_PREFIX(params.studentId)}/${fileName}`,
      ]);
    }
    return message(form, {
      message: m.members_pictureRemoved(),
      type: "success",
    });
  },
  updateFoodPreference: async (event) => {
    const { params, request } = event;
    const form = await superValidate(
      request,
      zod4(z.object({ foodPreference: z.string() })),
    );
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;
    const res = await serverApi(event).PATCH("/members/{studentId}/food-preference", {
      params: { path: { studentId } },
      body: { foodPreference: form.data.foodPreference },
    });
    if (res.error)
      return message(
        form,
        { message: m.members_errors_couldntFetchMember(), type: "error" },
        { status: (res.response.status as NumericRange<400, 599>) ?? 500 },
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
        { status: (res.response.status as NumericRange<400, 599>) ?? 500 },
      );

    await setNollningGroup(api, studentId, nollningGroupId ?? null);

    return message(form, {
      message: m.members_memberUpdated(),
      type: "success",
    });
  },
  ping: async ({ params, locals, request }) => {
    const { user, prisma } = locals;
    const form = await superValidate(request, zod4(emptySchema));
    authorize(apiNames.MEMBER.PING, user);
    if (!user?.memberId) return fail(401, { form });

    const { studentId } = params;
    try {
      await sendPing(prisma, {
        link: `/members/${user.studentId}`, // link back to user who pinged
        fromMemberId: { memberId: user.memberId! },
        toMemberId: { studentId },
      });
    } catch (e) {
      if (isHttpError(e)) {
        return message(
          form,
          {
            message: e.body.message,
            type: "error",
          },
          {
            status: e.status as NumericRange<400, 599>,
          },
        );
      }
      return message(form, {
        message: `${e}`,
        type: "error",
      });
    }
    return message(form, {
      message: m.members_pingSent(),
      type: "success",
    });
  },
};
