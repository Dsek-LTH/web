import apiNames from "$lib/utils/apiNames";
import { Prisma } from "@prisma/client";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.TAGS.READ, user);

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const createForm = await superValidate(createSchema);
  const updateForm = await superValidate(updateSchema);
  return {
    tags,
    createForm,
    updateForm,
  };
};

const createSchema = z.object({
  name: z.string().default(""),
});
export type CreateSchema = typeof createSchema;

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  color: z.string().optional(),
});
export type UpdateSchema = typeof updateSchema;

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, createSchema);
    if (!form.valid) return fail(400, { form });
    await prisma.tag.create({
      data: {
        name: form.data.name,
      },
    });
    return message(form, {
      message: "Tagg skapad",
      type: "success",
    });
  },
  update: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, updateSchema);
    if (!form.valid) return fail(400, { form });
    try {
      await prisma.tag.update({
        where: {
          id: form.data.id,
        },
        data: {
          name: form.data.name,
          color: form.data.color,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return message(
          form,
          {
            message: "Tagg hittades inte",
            type: "error",
          },
          { status: 400 },
        );
      }
      throw error;
    }
    return message(form, {
      message: "Tagg uppdaterad",
      type: "success",
    });
  },
};
