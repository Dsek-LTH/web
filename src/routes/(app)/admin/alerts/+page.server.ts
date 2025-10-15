import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { z } from "zod";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import softDelete from "$lib/utils/softDelete";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  authorize(apiNames.ALERT, locals.user);
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
  messageSv: z.string().min(1),
  messageEn: z.string().min(1),
});
export type addAlertSchema = Infer<typeof addAlertSchema>;

const deleteAlertSchema = z.object({
  id: z.string().uuid(),
});
export type deleteAlertSchema = Infer<typeof deleteAlertSchema>;

export const actions = {
  create: async ({ request, locals }) => {
    const { prisma } = locals;
    authorize(apiNames.ALERT, locals.user);
    const form = await superValidate(request, zod(addAlertSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.alert.create({
      data: {
        severity: form.data.severity,
        messageSv: form.data.messageSv,
        messageEn: form.data.messageEn,
      },
    });
    return message(form, {
      message: m.admin_alerts_alertCreated(),
      type: "success",
    });
  },
  delete: async ({ request, locals }) => {
    const { prisma } = locals;
    authorize(apiNames.ALERT, locals.user);
    const form = await superValidate(request, zod(deleteAlertSchema));
    if (!form.valid) return fail(400, { form });
    softDelete(() =>
      prisma.alert.update({
        where: { id: form.data.id },
        data: {
          removedAt: new Date(),
        },
      }),
    );
    return message(form, {
      message: m.admin_alerts_alertRemoved(),
      type: "success",
    });
  },
} satisfies Actions;
