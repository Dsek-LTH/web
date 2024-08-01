import { fileHandler } from "$lib/files";
import { error, fail } from "@sveltejs/kit";
import sharp from "sharp";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { PUBLIC_BUCKETS_MEMBERS } from "$env/static/public";
import { v4 as uuid } from "uuid";
import * as m from "$paraglide/messages";

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
    `public/${params.studentId}/profile-picture`,
    true,
  );
  return {
    member,
    photos,
    changeForm: await superValidate(changeSchema),
    uploadForm: await superValidate(uploadSchema),
    deleteForm: await superValidate(deleteSchema),
  };
};

const changeSchema = z.object({
  url: z.string().url(),
});
export type ChangeSchema = typeof changeSchema;
const uploadSchema = z.object({
  image: z.any(),
  cropWidth: z.number().min(0).default(0),
  cropHeight: z.number().min(0).default(0),
  cropX: z.number().min(0).default(0),
  cropY: z.number().min(0).default(0),
});
const deleteSchema = z.object({
  fileName: z.string(),
});
export type DeleteSchema = typeof deleteSchema;

export const actions: Actions = {
  change: async ({ params, locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(request, changeSchema);
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
    const form = await superValidate(formData, uploadSchema);
    if (!form.valid) return fail(400, { form });

    const image = formData.get("image");
    if (!image || !(image instanceof File) || image.size <= 0)
      return setError(form, "image", m.members_errors_invalidPicture());
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
        `public/${params.studentId}/profile-picture/${fileName}.webp`,
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
    const form = await superValidate(request, deleteSchema);
    if (!form.valid) return fail(400, { form });
    const fileName = form.data.fileName;
    await fileHandler.remove(locals.user, PUBLIC_BUCKETS_MEMBERS, [
      `${params.studentId}/profile-picture/${fileName}`,
    ]);
    return message(form, {
      message: m.members_pictureRemoved(),
      type: "success",
    });
  },
};
