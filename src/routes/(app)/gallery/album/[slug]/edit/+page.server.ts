import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { error, fail, redirect } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { editSchema } from "../types";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  authorize(apiNames.GALLERY.UPDATE, locals.user);

  const album = await locals.prisma.album.findFirst({
    where: { slug: params.slug },
    include: {
      photographers: true,
      editors: true,
    },
  });

  if (!album) {
    error(404, "Album not found");
  }

  return {
    slug: params.slug,
    form: await superValidate(
      {
        title: album.title,
        date: album.date,
        description: album.description ?? undefined,
        photographers: album.photographers.map(({ id, ...member }) => member),
        editors: album.editors.map(({ id, ...member }) => member),
      },
      zod4(editSchema),
    ),
  };
};

export const actions: Actions = {
  default: async ({ request, locals, params }) => {
    authorize(apiNames.GALLERY.UPDATE, locals.user);

    const form = await superValidate(
      await request.formData(),
      zod4(editSchema),
    );

    if (!form.valid) {
      return fail(400, { form });
    }

    const { title, date, description, photographers, editors } = form.data;
    const album = await locals.prisma.album.findFirst({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!album) {
      error(404, "Album not found");
    }

    const photographerStudentIds = photographers.flatMap((member) =>
      member.studentId ? [member.studentId] : [],
    );
    const editorStudentIds = editors.flatMap((member) =>
      member.studentId ? [member.studentId] : [],
    );

    const [existingPhotographers, existingEditors] = await Promise.all([
      locals.prisma.member.findMany({
        where: {
          studentId: { in: photographerStudentIds },
        },
        select: { id: true },
      }),
      locals.prisma.member.findMany({
        where: {
          studentId: { in: editorStudentIds },
        },
        select: { id: true },
      }),
    ]);

    await authorizedPrismaClient.album.update({
      where: { id: album.id },
      data: {
        title,
        description,
        date: new Date(date),
        updatedAt: new Date(date),
        photographers: {
          set: existingPhotographers,
        },
        editors: {
          set: existingEditors,
        },
      },
    });

    redirect(303, `/gallery/album/${params.slug}`);
  },
};
