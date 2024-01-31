import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";

const createSchema = z
  .object({
    role: z.string().nullable(),
    studentId: z.string().nullable(),
  })
  .refine(
    (data) =>
      (data.role !== null && data.studentId === null) ||
      (data.role === null && data.studentId !== null),
    {
      path: ["role"],
      message: "Either 'role' or 'studentId' must be defined",
    },
  );

const deleteSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteSchema = typeof deleteSchema;

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.ACCESS_POLICY.READ, user);

  const policies = await prisma.accessPolicy.findMany({
    where: {
      apiName: params.apiName,
    },
    include: {
      member: true,
    },
  });
  const createForm = await superValidate(createSchema);
  const deleteForm = await superValidate(deleteSchema);
  return {
    policies,
    createForm,
    deleteForm,
  };
};

export const actions: Actions = {
  create: async ({ params, request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, createSchema);
    if (!form.valid) return fail(400, { form });
    if (
      form.data.studentId &&
      (await prisma.member.count({
        where: { studentId: form.data.studentId },
      })) === 0
    ) {
      return setError(form, "studentId", "Medlem hittades inte");
    }
    await prisma.accessPolicy.create({
      data: {
        apiName: params.apiName,
        role: form.data.role,
        studentId: form.data.studentId,
      },
    });
    return message(form, {
      message: "Access policy skapad",
      type: "success",
    });
  },
  delete: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, deleteSchema);
    if (!form.valid) return fail(400, { form });
    await prisma.accessPolicy.delete({
      where: {
        id: form.data.id,
      },
    });
    return message(form, {
      message: "Policy borttagen",
      type: "success",
    });
  },
};
