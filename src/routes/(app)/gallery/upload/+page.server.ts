import { fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { uploadSchema } from "./types";
import { uploadAlbumFiles, uploadCoverFile } from "./uploadFiles";
import { redirect } from "$lib/utils/redirect";
import { slugify, slugWithCount } from "$lib/utils/slugify";

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod4(uploadSchema));
  return { form };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { prisma, user } = locals;

    const form = await superValidate(request, zod4(uploadSchema), {
      allowFiles: true,
    });

    const { title, date, photographers, editors, albumFiles } = form.data;

    let slug = slugify(title);
    const existingAlbum = await prisma.album.findFirst({
      where: { slug: slug },
    });
    if (existingAlbum) {
      form.data.title = slugWithCount(title, 1);
      const newSlug = slugify(form.data.title);
      slug = newSlug;
    }

    if (!form.valid) return fail(400, withFiles({ form }));
    try {
      await uploadAlbumFiles(user, form.data, slug);
      await uploadCoverFile(user, form.data, slug);
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

    const result = await prisma.album.create({
      data: {
        title: title,
        date: new Date(date),
        updatedAt: new Date(date),
        slug: slug,
        imageCount: albumFiles.length,
        photographers: {
          connect: photographers
            .filter((p) => p?.studentId != null)
            .map((p) => ({ studentId: p.studentId! })),
        },
        editors: {
          connect: editors
            .filter((e) => e?.studentId != null)
            .map((e) => ({ studentId: e.studentId! })),
        },
      },
    });

    await prisma.album.update({
      where: { id: result.id },
      data: {
        slug: slug,
      },
    });

    redirect(303, "/gallery/album/" + slug);
  },
};
