import { memberSchema } from "$lib/zod/schemas";
import { api } from "$lib/api/client";
import * as m from "$paraglide/messages";
import { error, fail, redirect, type NumericRange } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { PUBLIC_BUCKETS_MEMBERS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import sharp from "sharp";
import { withFiles } from "sveltekit-superforms/server";
import { v4 as uuid } from "uuid";
import type { Actions, PageServerLoad } from "./$types";
import { deletePictureSchema, uploadPictureSchema } from "../types";
import { removeMyProfilePicture } from "$lib/files/photos/profilePictures";

const PROFILE_PICTURE_PREFIX = (studentId: string) =>
  `public/${studentId}/profile-picture`;

// Server-only load, not +page.ts - same exception as the profile view page
// (see its own comment): `phadderGroups` isn't part of the Go member API
// yet (Phase 2 nollning redesign), so this can't move to a universal load.
export const load: PageServerLoad = async ({ locals, fetch, params }) => {
  const { prisma } = locals;
  const { studentId } = params;

  const [memberRes, phadderGroupsResult] = await Promise.allSettled([
    api.GET("/members/{studentId}", {
      fetch,
      params: { path: { studentId } },
    }),
    prisma.phadderGroup.findMany({ orderBy: { year: "asc" } }),
  ]);
  if (memberRes.status === "rejected" || memberRes.value.error)
    throw error(500, m.members_errors_couldntFetchMember());
  if (phadderGroupsResult.status === "rejected")
    throw error(505, phadderGroupsResult.reason);

  const profile = memberRes.value.data;
  if (!profile) throw error(404, m.members_errors_memberNotFound());

  try {
    return {
      form: await superValidate(profile, zod4(memberSchema)),
      viewedMember: profile, // https://github.com/Dsek-LTH/web/issues/194
      phadderGroups: phadderGroupsResult.value,
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
  update: async ({ params, locals, fetch, request }) => {
    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    const { studentId } = params;
    const { nollningGroupId, foodPreference, ...profileFields } = form.data;

    const res = await api.PATCH("/members/{studentId}", {
      fetch,
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
        fetch,
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

    // nollningGroupId isn't part of the Go member API yet (owned by the
    // Phase 2 nollning redesign, see DESIGN.md's roadmap) - narrow,
    // explicit, temporary direct write, not a broader Prisma bridge for the
    // rest of the (now Go-backed) member domain.
    await locals.prisma.member.update({
      where: { studentId },
      data: { nollningGroupId: nollningGroupId ?? null },
    });

    throw redirect(302, `/members/${params.studentId}`);
  },
};
