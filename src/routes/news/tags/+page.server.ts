import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { Prisma } from "@prisma/client";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.TAGS.READ, accessPolicies);
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

export const actions = {
  create: async ({ request, locals }) => {
    const form = await superValidate(request, createSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.TAGS.CREATE,
      session?.user,
      async () => {
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
      form
    );
  },
  update: async ({ request, locals }) => {
    const form = await superValidate(request, updateSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.NEWS.UPDATE,
      session?.user,
      async () => {
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
              { status: 400 }
            );
          }
          throw error;
        }
        return message(form, {
          message: "Tagg uppdaterad",
          type: "success",
        });
      },
      form
    );
  },
};
