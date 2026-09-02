import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { z } from "zod";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import * as m from "$paraglide/messages";
import { api } from "$lib/api/client";

// alert:manage (Go's AlertManage) is enforced by the Go API itself on
// create/delete - see backend/internal/alerts. No authorize() call here,
// matching DESIGN.md's Principle #5.
export const load: PageServerLoad = async ({ fetch }) => {
  const res = await api.GET("/alerts", { fetch });
  if (res.error) throw new Error("Failed to load alerts");
  return {
    alert: res.data ?? [],
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
  create: async ({ request }) => {
    const form = await superValidate(request, zod4(addAlertSchema));
    if (!form.valid) return fail(400, { form });
    const created = await api.POST("/alerts", { body: form.data });
    if (created.error) throw new Error("Failed to create alert");
    return message(form, {
      message: m.admin_alerts_alert_created(),
      type: "success",
    });
  },
  delete: async ({ request }) => {
    const form = await superValidate(request, zod4(deleteAlertSchema));
    if (!form.valid) return fail(400, { form });
    const deleted = await api.DELETE("/alerts/{id}", {
      params: { path: { id: form.data.id } },
    });
    if (deleted.error) throw new Error("Failed to remove alert");
    return message(form, {
      message: m.admin_alerts_alert_removed(),
      type: "success",
    });
  },
} satisfies Actions;
