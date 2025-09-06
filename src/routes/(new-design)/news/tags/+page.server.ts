import apiNames from "$lib/utils/apiNames";
import { Prisma } from "@prisma/client";
import { fail } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.TAGS.READ, user);

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const createForm = await superValidate(zod(createSchema));
  const updateForm = await superValidate(zod(updateSchema));
  return {
    tags,
    createForm,
    updateForm,
  };
};

const createSchema = z.object({
  name: z.string().default(""),
});
export type CreateSchema = Infer<typeof createSchema>;

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  nameEn: z.string().nullable().optional(),
  color: z.string().optional(),
});
export type UpdateSchema = Infer<typeof updateSchema>;

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(createSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.tag.create({
      data: {
        name: form.data.name,
      },
    });
    return message(form, {
      message: m.news_tags_tagCreated(),
      type: "success",
    });
  },
  update: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateSchema));
    if (!form.valid) return fail(400, { form });
    const { id, ...data } = form.data;
    try {
      await prisma.tag.update({
        where: {
          id,
        },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return message(
          form,
          {
            message: m.news_errors_tagNotFound(),
            type: "error",
          },
          { status: 400 },
        );
      }
      throw error;
    }
    return message(form, {
      message: m.news_tags_tagUpdated(),
      type: "success",
    });
  },
};
