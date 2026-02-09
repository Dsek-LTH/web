import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { z } from "zod";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
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
  message_sv: z.string().min(1),
  message_en: z.string().min(1),
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
    const form = await superValidate(request, zod4(addAlertSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.alert.create({
      data: {
        severity: form.data.severity,
        messageSv: form.data.message_sv,
        messageEn: form.data.message_en,
      },
    });
    return message(form, {
      message: m.admin_alerts_alert_created(),
      type: "success",
    });
  },
  delete: async ({ request, locals }) => {
    const { prisma } = locals;
    authorize(apiNames.ALERT, locals.user);
    const form = await superValidate(request, zod4(deleteAlertSchema));
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
      message: m.admin_alerts_alert_removed(),
      type: "success",
    });
  },
} satisfies Actions;
