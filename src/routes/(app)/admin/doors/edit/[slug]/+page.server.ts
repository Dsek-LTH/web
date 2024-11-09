import apiNames from "$lib/utils/apiNames";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { fail } from "@sveltejs/kit";
import { authorize } from "$lib/utils/authorization";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.DOOR.READ, user);

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
  return {
    doorAccessPolicies,
    createForm: await superValidate(zod(createSchema), { id: "createForm" }),
    banForm: await superValidate(zod(createSchema), { id: "banForm" }),
    deleteForm: await superValidate(zod(deleteSchema)),
  };
};

const createSchema = z
  .object({
    studentId: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    startDatetime: z.date().optional(),
    endDatetime: z.date().optional(),
    information: z.string().optional(),
  })
  .refine((data) => data.studentId != null || data.role != null, {
    message: "Du måste ange roll eller student id",
  });

const deleteSchema = z.object({
  id: z.string(),
});

export const actions: Actions = {
  create: async ({ request, locals, params }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(createSchema));
    if (!form.valid) return fail(400, { form });
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
  ban: async ({ request, locals, params }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(createSchema));
    if (!form.valid) return fail(400, { form });
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
        isBan: true,
        ...form.data,
      },
    });
    return message(form, {
      message: "Dörrpolicy skapad",
      type: "success",
    });
  },
  delete: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(deleteSchema));
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await prisma.doorAccessPolicy.delete({
      where: { id },
    });
    return message(form, {
      message: "Dörrpolicy raderad",
      type: "success",
    });
  },
};
