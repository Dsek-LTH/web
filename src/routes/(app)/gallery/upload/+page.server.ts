import { fail } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { uploadSchema } from "./types";
import { uploadAlbumFiles, uploadCoverFile } from "./uploadFiles";
import { redirect } from "@sveltejs/kit";
import { slugify, slugWithCount } from "$lib/utils/slugify";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod4(uploadSchema));
  return { form };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    console.log("Received album upload request");
    const { user, prisma } = locals;
    authorize(apiNames.GALLERY.CREATE, user);

    const rawFormData = await request.formData();

    const form = await superValidate(rawFormData, zod4(uploadSchema), {
      allowFiles: true,
    });

    const { title, date, description, photographers, editors, albumFiles } =
      form.data;

    let slug = slugify(title);
    console.log("Generated slug:", slug);
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
      console.log("Uploading album files for slug:", slug);
      await uploadAlbumFiles(user, form.data, slug);
      console.log("Uploading cover file for slug:", slug);
      await uploadCoverFile(user, form.data, slug);
      console.log("File uploads completed for slug:", slug);
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

    let result: { id: string };
    try {
      console.log("Creating album in database with title:", title);
      result = await authorizedPrismaClient.album.create({
        data: {
          title,
          description,
          date: new Date(date),
          updatedAt: new Date(date),
          slug,
          imageCount: albumFiles.length,
          photographers:
            photographerConnect.length > 0
              ? { connect: photographerConnect }
              : undefined,
          editors:
            editorConnect.length > 0 ? { connect: editorConnect } : undefined,
        },
        select: { id: true },
      });
      console.log("Album created in database with ID:", result.id);
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

    console.log("Album created with ID:", result.id);
    console.log("Redirecting to album page with slug:", slug);
    redirect(303, "/gallery/album/" + slug);
  },
};
