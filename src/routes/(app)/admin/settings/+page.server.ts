import {
  NOLLNING_END_KEY,
  NOLLNING_START_KEY,
  updateNollningPeriod,
} from "$lib/utils/adminSettings/nollning";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.ADMIN.SETTINGS.READ, user);
  const settings = await prisma.adminSetting.findMany();
  const nollningStartStr = settings.find(
    (setting) => setting.key === NOLLNING_START_KEY,
  )?.value;
  const nollningEndStr = settings.find(
    (setting) => setting.key === NOLLNING_END_KEY,
  )?.value;
  return {
    settings,
    nollning:
      nollningStartStr && nollningEndStr
        ? {
            start: new Date(nollningStartStr),
            end: new Date(nollningEndStr),
          }
        : undefined,
    updateForm: await superValidate(zod(updateSchema)),
    updateNollningForm: await superValidate(zod(updateNollningPeriodSchema)),
  };
};

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});
const removeSchema = z.object({
  key: z.string().min(1),
});
const updateNollningPeriodSchema = z.object({
  start: z.date(),
  end: z.date(),
});

export const actions = {
  async update({ locals, request }) {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.adminSetting.upsert({
      where: { key: form.data.key },
      update: { value: form.data.value },
      create: { key: form.data.key, value: form.data.value },
    });
    return message(form, {
      message: `Inställning ${form.data.key} uppdaterad`,
      type: "success",
    });
  },
  async remove({ locals, request }) {
    const { prisma } = locals;
    const form = await superValidate(request, zod(removeSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.adminSetting.delete({ where: { key: form.data.key } });
    return message(form, {
      message: `Inställning ${form.data.key} raderad`,
      type: "success",
    });
  },
  async updateNollning({ locals, request }) {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateNollningPeriodSchema));
    if (!form.valid) return fail(400, { form });
    await updateNollningPeriod(prisma, form.data.start, form.data.end);
    return message(form, {
      message: `Nollningsperiod uppdaterad`,
      type: "success",
    });
  },
};
