import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { z } from "zod";
import { message, superValidate } from "sveltekit-superforms/server";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const alert = prisma.alert.findMany({
    where: {
      removedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return {
    alert: await alert,
  };
};

const addAlertSchema = z.object({
  severity: z.enum(["info", "success", "warning", "error"]),
  message: z.string().min(1),
  messageEn: z.string().min(1),
});
export type addAlertSchema = typeof addAlertSchema;

const deleteAlertSchema = z.object({
  id: z.string().uuid(),
});
export type deleteAlertSchema = typeof deleteAlertSchema;

export const actions = {
  create: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, addAlertSchema);
    if (!form.valid) return fail(400, { form });
    await prisma.alert.create({
      data: {
        severity: form.data.severity,
        message: form.data.message,
        messageEn: form.data.messageEn,
      },
    });
    return message(form, {
      message: "Global alert skapad",
      type: "success",
    });
  },
  delete: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, deleteAlertSchema);
    if (!form.valid) return fail(400, { form });
    await prisma.alert.update({
      where: { id: form.data.id },
      data: {
        removedAt: new Date(),
      },
    });
    return message(form, {
      message: "Global alert stängd",
      type: "success",
    });
  },
} satisfies Actions;
