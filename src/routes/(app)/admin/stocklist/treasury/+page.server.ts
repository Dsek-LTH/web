import type { Actions, PageServerLoad } from "../$types";
import { z } from "zod";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import dayjs from "dayjs";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { redirect } from "$lib/utils/redirect";

const deleteSchema = z.object({
  id: z.string(),
});

const dateSchema = z.object({
  date: z.string().nullable(),
});

const updateSchema = z.object({
  id: z.string(),
  quantityDelta: z.number(),
});

export const load: PageServerLoad = async (event) => {
  const { prisma } = event.locals;
  const date = event.url.searchParams.get("date");
  const deleteForm = await superValidate(zod(deleteSchema));
  const updateForm = await superValidate(zod(updateSchema));
  const dateForm = await superValidate({ date: date ?? null }, zod(dateSchema));

  let entries;

  if (date) {
    entries = await prisma.drinkItemBatch.findMany({
      where: {
        date: { lte: new Date(date) },
      },
      include: { item: true },
      orderBy: { date: "desc" },
    });
  } else {
    entries = await prisma.drinkItemBatch.findMany({
      include: { item: true },
      orderBy: { date: "desc" },
    });
  }

  const entriesOnDate =
    date == null
      ? entries
      : entries.filter((i) => dayjs(i.date).format("YYYY-MM-DD") === date!);

  return {
    entriesOnDate,
    deleteForm,
    updateForm,
    dateForm,
  };
};

export const actions: Actions = {
  updateEntry: async (event) => {
    const { prisma, user } = event.locals;
    authorize(apiNames.DRINKITEMBATCH.UPDATE, user);
    const form = await superValidate(event.request, zod(updateSchema));
    if (!form.valid) return fail(400, { form });

    const batchId = form.data.id;
    const requestedDelta = form.data.quantityDelta;
    try {
      await prisma.$transaction(async (tx) => {
        const batch = await tx.drinkItemBatch.findUnique({
          where: { id: batchId },
          include: {
            item: true,
          },
        });

        const newAmount =
          batch!.item.quantityAvailable! -
          batch!.quantityDelta +
          requestedDelta;

        if (newAmount < 0) {
          throw new Error("Totalt antal blir negativt");
        }

        await tx.drinkItemBatch.update({
          where: { id: batchId },
          data: {
            quantityDelta: requestedDelta,
          },
        });

        await tx.drinkItem.update({
          where: { id: batch?.item.id },
          data: {
            quantityAvailable: newAmount,
          },
        });
      });
    } catch {
      return message(form, { message: "Totalt antal blir negativt" });
    }

    return message(form, { message: `Logg uppdaterad` });
  },

  deleteEntry: async (event) => {
    const { prisma, user } = event.locals;
    authorize(apiNames.DRINKITEMBATCH.DELETE, user);
    const form = await superValidate(event.request, zod(deleteSchema));
    if (!form.valid) return fail(400, { form });

    const batchId = form.data.id;
    try {
      await prisma.$transaction(async (tx) => {
        const batch = await tx.drinkItemBatch.findUnique({
          where: { id: batchId },
          include: {
            item: true,
          },
        });
        const newAmount =
          batch!.item.quantityAvailable! - batch!.quantityDelta!;

        if (newAmount < 0) {
          throw new Error("Totalt antal blir negativt");
        }

        await tx.drinkItem.update({
          where: { id: batch?.item.id },
          data: {
            quantityAvailable: newAmount,
          },
        });

        await tx.drinkItemBatch.delete({
          where: { id: batchId },
        });
      });
    } catch {
      return message(form, { message: "Totalt antal blir negativt" });
    }
    return message(form, { message: `Logg borttagen` });
  },

  redirectDate: async (event) => {
    const form = await superValidate(event.request, zod(dateSchema));

    if (!form.valid) return fail(400, { form });

    if (form.data.date === null) {
      redirect(302, "treasury");
    }

    const date = dayjs(form.data.date).format("YYYY-MM-DD");
    event.url.searchParams.set("date", date);
    event.url.searchParams.delete("/redirectDate");
    redirect(302, event.url);
  },
};
