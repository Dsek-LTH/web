import { fileHandler } from "$lib/files";
import { ctxAccessGuard } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { Prisma } from "@prisma/client";
import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import sharp from "sharp";

function generateUUID() {
  let d = new Date().getTime();
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

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
    "dev-members",
    `${params.studentId}/profile-picture`,
    true
  );
  return {
    member,
    photos,
  };
};

export const actions = {
  change: async ({ params, locals, request }) => {
    const session = await locals.getSession();
    const studentId = params.studentId;
    await ctxAccessGuard(apiNames.MEMBER.UPDATE, session?.user, { studentId });
    const formData = await request.formData();
    const url = (formData.get("url") as string | null) ?? undefined;
    if (!url || typeof url !== "string")
      return fail(400, {
        error: "Invalid url",
        data: Object.fromEntries(formData),
      });
    try {
      await prisma.member.update({
        where: { studentId },
        data: {
          picturePath: url,
        },
      });
      return {
        success: true,
        data: Object.fromEntries(formData),
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025" || e.code === "2016") {
          return fail(404, { error: "Member not found", data: Object.fromEntries(formData) });
        }
        return fail(500, {
          error: e.message ?? "Unknown error",
          data: Object.fromEntries(formData),
        });
      }
    }
  },
  upload: async ({ params, locals, request }) => {
    const session = await locals.getSession();
    const studentId = params.studentId;
    await ctxAccessGuard(apiNames.MEMBER.UPDATE, session?.user, { studentId });
    const failWithData = (error: string, statusCode: number = 400) => {
      // in case of an error return the data and errors
      formData.delete("image"); // not serializable
      const data = {
        data: Object.fromEntries(formData),
        error,
      };
      return fail(statusCode, data);
    };
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    if (!image || !(image instanceof File) || image.size <= 0) return failWithData("Invalid file");
    const fileName = generateUUID();
    // get x,y,width,height from front end
    const width = formData.get("crop-width") as string | null;
    const height = formData.get("crop-height") as string | null;
    const x = formData.get("crop-x") as string | null;
    const y = formData.get("crop-y") as string | null;
    if ((width && height && width !== height) || Number.isNaN(Number(width)) || Number(width) <= 0)
      return failWithData("Invalid crop size");
    try {
      const buffer = await sharp(await image.arrayBuffer())
        // this is required to keep the image upright
        .rotate()
        // crop image according to frontend settings
        .extract({
          left: Number(x ?? "0"),
          top: Number(y ?? "0"),
          width: Number(width),
          height: Number(height),
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
        "dev-members",
        `${params.studentId}/profile-picture/${fileName}.webp`
      );
      const res = await fetch(putUrl, {
        method: "PUT",
        body: buffer,
      });
      if (!res.ok) return failWithData("Error uploading file", res.status);
      formData.delete("image"); // not serializable
      return {
        success: true,
        data: Object.fromEntries(formData),
      };
    } catch (e: any) {
      if ("body" in e && "message" in e.body) {
        return failWithData(e.body.message, 500);
      }
      return failWithData(String(e), 500);
    }
  },
  delete: async ({ params, locals, request }) => {
    const session = await locals.getSession();
    const studentId = params.studentId;
    await ctxAccessGuard(apiNames.MEMBER.UPDATE, session?.user, { studentId });
    const formData = await request.formData();
    const fileName = (formData.get("fileName") as string | null) ?? undefined;
    if (!fileName || typeof fileName !== "string")
      return fail(400, {
        error: "Invalid fileName",
        data: Object.fromEntries(formData),
      });
    try {
      await fileHandler.remove(session?.user, "dev-members", [
        `${params.studentId}/profile-picture/${fileName}`,
      ]);
      return {
        success: true,
        data: Object.fromEntries(formData),
      };
    } catch (e: any) {
      if ("body" in e && "message" in e.body) {
        return fail(500, {
          error: e.body.message,
          data: Object.fromEntries(formData),
        });
      }
      return fail(500, {
        error: String(e),
        data: Object.fromEntries(formData),
      });
    }
  },
};
