import { fileHandler } from "$lib/files";
import { ctxAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { error, fail } from "@sveltejs/kit";
import sharp from "sharp";
import generateUUID from "$lib/utils/generateUUID";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import { PUBLIC_BUCKETS_MEMBERS } from "$env/static/public";

export const load: PageServerLoad = async ({ params, parent }) => {
  const member = await prisma.member.findUnique({
    where: {
      studentId: params.studentId,
    },
  });
  if (!member) {
    throw error(404, "Member not found");
  }
  const { session } = await parent();
  await ctxAccessGuard(apiNames.MEMBER.UPDATE, session?.user, { studentId: params.studentId });
  const photos = await fileHandler.getInBucket(
    session?.user,
    PUBLIC_BUCKETS_MEMBERS,
    `${params.studentId}/profile-picture`,
    true
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

export const actions = {
  change: async ({ params, locals, request }) => {
    const form = await superValidate(request, changeSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    const studentId = params.studentId;
    return withAccess(
      apiNames.MEMBER.UPDATE,
      session?.user,
      async () => {
        await prisma.member.update({
          where: { studentId },
          data: {
            picturePath: form.data.url,
          },
        });
        return message(form, {
          message: "Bild ändrad",
          type: "success",
        });
      },
      form,
      { studentId }
    );
  },
  upload: async ({ params, locals, request }) => {
    const formData = await request.formData();
    const form = await superValidate(formData, uploadSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    const studentId = params.studentId;
    return withAccess(
      apiNames.MEMBER.UPDATE,
      session?.user,
      async () => {
        const image = formData.get("image");
        if (!image || !(image instanceof File) || image.size <= 0)
          return setError(form, "image", "Ogiltig bild");
        const fileName = generateUUID();
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
            session?.user,
            PUBLIC_BUCKETS_MEMBERS,
            `${params.studentId}/profile-picture/${fileName}.webp`
          );
          const res = await fetch(putUrl, {
            method: "PUT",
            body: buffer,
          });
          if (!res.ok)
            return message(
              form,
              { message: "Kunde inte ladda upp fil", type: "error" },
              { status: 500 }
            );
        } catch (e) {
          console.log(e);
          return message(
            form,
            {
              message: "Kunde inte ladda upp fil",
              type: "error",
            },
            { status: 500 }
          );
        }
        return message(form, {
          message: "Bild uppladdad",
          type: "success",
        });
      },
      form,
      { studentId }
    );
  },
  delete: async ({ params, locals, request }) => {
    const form = await superValidate(request, deleteSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    const studentId = params.studentId;
    return withAccess(
      apiNames.MEMBER.UPDATE,
      session?.user,
      async () => {
        const fileName = form.data.fileName;
        await fileHandler.remove(session?.user, PUBLIC_BUCKETS_MEMBERS, [
          `${params.studentId}/profile-picture/${fileName}`,
        ]);
        return message(form, {
          message: "Bild borttagen",
          type: "success",
        });
      },
      form,
      { studentId }
    );
  },
};
