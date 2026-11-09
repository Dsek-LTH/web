import {
  N0LLNING_END_KEY,
  N0LLNING_START_KEY,
  updateN0llningPeriod,
} from "$lib/utils/adminSettings/nollning";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import * as messages from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.ADMIN.SETTINGS.READ, user);
  const settings = await prisma.adminSetting.findMany();
  const n0llningStartStr = settings.find(
    (setting) => setting.key === N0LLNING_START_KEY,
  )?.value;
  const n0llningEndStr = settings.find(
    (setting) => setting.key === N0LLNING_END_KEY,
  )?.value;
  return {
    settings,
    n0llning:
      n0llningStartStr && n0llningEndStr
        ? {
            start: new Date(n0llningStartStr),
            end: new Date(n0llningEndStr),
          }
        : undefined,
    updateForm: await superValidate(zod4(updateSchema)),
    updateN0llningForm: await superValidate(zod4(updateN0llningPeriodSchema)),
  };
};

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});
const removeSchema = z.object({
  key: z.string().min(1),
});
const updateN0llningPeriodSchema = z.object({
  start: z.date(),
  end: z.date(),
});

export const actions = {
  async update({ locals, request }) {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.adminSetting.upsert({
      where: { key: form.data.key },
      update: { value: form.data.value },
      create: { key: form.data.key, value: form.data.value },
    });
    return message(form, {
      message: messages.admin_settings_updated({ setting: form.data.key }),
      type: "success",
    });
  },
  async remove({ locals, request }) {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(removeSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.adminSetting.delete({ where: { key: form.data.key } });
    return message(form, {
      message: messages.admin_settings_deleted({ setting: form.data.key }),
      type: "success",
    });
  },
  async updateN0llning({ locals, request }) {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(updateN0llningPeriodSchema));
    if (!form.valid) return fail(400, { form });
    await updateN0llningPeriod(prisma, form.data.start, form.data.end);
    return message(form, {
      message: messages.admin_settings_n0llning_period_updated(),
      type: "success",
    });
  },
};
