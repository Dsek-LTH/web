import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import {
  message,
  setError,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";

const createSchema = z.object({
  type: z.enum(["member", "role"]),
  subjects: z.array(z.string()).min(1),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteSchema = Infer<typeof deleteSchema>;

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.ACCESS_POLICY.CREATE, user);

  const policies = await prisma.accessPolicy.findMany({
    where: {
      apiName: params.apiName,
    },
    include: {
      member: true,
    },
  });
  const createForm = await superValidate(zod4(createSchema));
  const deleteForm = await superValidate(zod4(deleteSchema));
  return {
    policies,
    createForm,
    deleteForm,
  };
};

export const actions: Actions = {
  create: async ({ params, request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(createSchema));
    if (!form.valid) return fail(400, { form });
    const { type, subjects } = form.data;

    if (type === "member") {
      const existing = await prisma.member.count({
        where: { studentId: { in: subjects } },
      });
      if (existing !== subjects.length) {
        return setError(form, "", "En eller flera medlemmar hittades inte");
      }
    }

    await prisma.accessPolicy.createMany({
      data: subjects.map((subject) => ({
        apiName: params.apiName,
        role: type === "role" ? subject : null,
        studentId: type === "member" ? subject : null,
      })),
    });
    return message(form, {
      message: "Access policy skapad",
      type: "success",
    });
  },
  delete: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(deleteSchema));
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
