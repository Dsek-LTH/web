import { PUBLIC_BUCKETS_MEMBERS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import * as m from "$paraglide/messages";
import { error, fail } from "@sveltejs/kit";
import sharp from "sharp";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import { v4 as uuid } from "uuid";
import type { Actions, PageServerLoad } from "./$types";
import { changeSchema, deleteSchema, uploadSchema } from "./types";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { removeFilesWithoutAccessCheck } from "$lib/files/fileHandler";

const PROFILE_PICTURE_PREFIX = (studentId: string) =>
  `public/${studentId}/profile-picture`;

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;
  const member = await prisma.member.findUnique({
    where: {
      studentId: params.studentId,
    },
  });
  if (!member) {
    throw error(404, m.members_errors_memberNotFound());
  }
  const photos = await fileHandler.getInBucket(
    locals.user,
    PUBLIC_BUCKETS_MEMBERS,
    PROFILE_PICTURE_PREFIX(params.studentId),
    true,
  );
  return {
    member,
    photos,
    changeForm: await superValidate(zod(changeSchema)),
    uploadForm: await superValidate(zod(uploadSchema)),
    deleteForm: await superValidate(zod(deleteSchema)),
  };
};

export const actions: Actions = {
  change: async ({ params, locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(changeSchema));
    if (!form.valid) return fail(400, { form });
    const studentId = params.studentId;
    await prisma.member.update({
      where: { studentId },
      data: {
        picturePath: form.data.url,
      },
    });
    return message(form, {
      message: m.members_pictureChanged(),
      type: "success",
    });
  },
  upload: async ({ params, locals, request }) => {
    const formData = await request.formData();
    const form = await superValidate(formData, zod(uploadSchema), {
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
  delete: async ({ params, locals, request }) => {
    const form = await superValidate(request, zod(deleteSchema));
    if (!form.valid) return fail(400, { form });
    const fileName = form.data.fileName;
    if (locals.user.studentId !== params.studentId) {
      authorize(
        apiNames.FILES.BUCKET(PUBLIC_BUCKETS_MEMBERS).DELETE,
        locals.user,
      );
    }
    await removeFilesWithoutAccessCheck(locals.user, PUBLIC_BUCKETS_MEMBERS, [
      `${PROFILE_PICTURE_PREFIX(params.studentId)}/${fileName}`,
    ]);
    return message(form, {
      message: m.members_pictureRemoved(),
      type: "success",
    });
  },
};
