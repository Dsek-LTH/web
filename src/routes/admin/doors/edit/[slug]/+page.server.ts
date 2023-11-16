import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ parent, params }) => {
  const doorAccessPolicies = await prisma.doorAccessPolicy.findMany({
    where: {
      doorName: params.slug,
      OR: [
        {
          endDatetime: {
            gte: new Date(),
          },
        },
        {
          endDatetime: null,
        },
      ],
    },
    include: {
      member: true,
    },
    orderBy: [
      {
        startDatetime: "asc",
      },
      {
        role: "asc",
      },
      {
        studentId: "asc",
      },
    ],
  });
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.DOOR.READ, accessPolicies);
  return {
    doorAccessPolicies,
    createForm: await superValidate(createSchema),
    deleteForm: await superValidate(deleteSchema),
  };
};

const createSchema = z
  .object({
    studentId: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    startDatetime: z.date().optional(),
    endDatetime: z.date().optional(),
  })
  .refine((data) => data.studentId != null || data.role != null, {
    message: "Du måste ange roll och studentid",
  });
const deleteSchema = z.object({
  id: z.string(),
});

export const actions = {
  create: async ({ request, locals, params }) => {
    const form = await superValidate(request, createSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.DOOR.UPDATE,
      session?.user,
      async () => {
        const doorName = params.slug;
        const { studentId } = form.data;
        if (
          studentId &&
          (await prisma.member.count({
            where: { studentId },
          })) <= 0
        ) {
          return setError(form, "studentId", "Medlemmen finns inte");
        }
        await prisma.doorAccessPolicy.create({
          data: {
            doorName,
            ...form.data,
          },
        });
        return message(form, {
          message: "Dörrpolicy skapad",
          type: "success",
        });
      },
      form
    );
  },
  delete: async ({ request, locals }) => {
    const form = await superValidate(request, deleteSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.DOOR.DELETE,
      session?.user,
      async () => {
        const { id } = form.data;
        await prisma.doorAccessPolicy.delete({
          where: { id },
        });
        return message(form, {
          message: "Dörrpolicy raderad",
          type: "success",
        });
      },
      form
    );
  },
};
