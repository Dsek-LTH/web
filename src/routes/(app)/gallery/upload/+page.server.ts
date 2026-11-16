import { fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { uploadSchema } from "./types";
import { uploadAlbumFiles, uploadCoverFile } from "./uploadFiles";
import { redirect } from "@sveltejs/kit";
import { slugifyWithYear, findAvailableSlug } from "$lib/utils/slugify";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { randomUUID } from "node:crypto";

export const load: PageServerLoad = async ({ locals }) => {
  authorize(apiNames.GALLERY.CREATE, locals.user);

  const form = await superValidate(zod4(uploadSchema));
  return { form };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { user, prisma } = locals;

    const rawFormData = await request.formData();

    const form = await superValidate(rawFormData, zod4(uploadSchema), {
      allowFiles: true,
    });

    const { title, date, description, photographers, editors, albumFiles } =
      form.data;

    const baseSlug = slugifyWithYear(title, new Date(date).getFullYear());
    const slug = await findAvailableSlug(baseSlug, async (candidate) =>
      Boolean(await prisma.album.findFirst({ where: { slug: candidate } })),
    );
    const albumId = randomUUID();

    if (!form.valid) return fail(400, withFiles({ form }));
    try {
      console.log("Uploading album files for id:", albumId);
      await uploadAlbumFiles(user, form.data, albumId);
      console.log("Uploading cover file for id:", albumId);
      await uploadCoverFile(user, form.data, albumId);
      console.log("File uploads completed for id:", albumId);
    } catch (e) {
      return message(
        form,
        {
          message: e instanceof Error ? e.message : `${e}`,
          type: "error",
        },
        { status: 500 },
      );
    }

    const photographerConnect = photographers
      .filter((p) => p?.studentId != null)
      .map((p) => ({ studentId: p.studentId! }));

    const editorConnect = editors
      .filter((e) => e?.studentId != null)
      .map((e) => ({ studentId: e.studentId! }));

    // Verify photographers and editors exist before connecting
    let validPhotographers: Array<{ studentId: string }> = [];
    let validEditors: Array<{ studentId: string }> = [];

    if (photographerConnect.length > 0) {
      const existingPhotographers = await prisma.member.findMany({
        where: {
          studentId: { in: photographerConnect.map((p) => p.studentId) },
        },
        select: { studentId: true },
      });
      const existingIds = new Set(
        existingPhotographers.map((p) => p.studentId),
      );
      validPhotographers = photographerConnect.filter((p) =>
        existingIds.has(p.studentId),
      );
    }

    if (editorConnect.length > 0) {
      const existingEditors = await prisma.member.findMany({
        where: {
          studentId: { in: editorConnect.map((e) => e.studentId) },
        },
        select: { studentId: true },
      });
      const existingIds = new Set(existingEditors.map((e) => e.studentId));
      validEditors = editorConnect.filter((e) => existingIds.has(e.studentId));
    }

    try {
      await prisma.album.create({
        data: {
          id: albumId,
          title,
          description,
          date: new Date(date),
          updatedAt: new Date(date),
          slug,
          imageCount: albumFiles.length,
          photographers:
            validPhotographers.length > 0
              ? { connect: validPhotographers }
              : undefined,
          editors:
            validEditors.length > 0 ? { connect: validEditors } : undefined,
        },
        select: { id: true },
      });
    } catch (e) {
      console.error("Error creating album in database:", e);
      return message(
        form,
        {
          message: `Album create failed: ${e instanceof Error ? e.message : `${e}`}`,
          type: "error",
        },
        { status: 500 },
      );
    }

    redirect(303, "/gallery/album/" + slug);
  },
};
