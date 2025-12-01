import type { Actions, PageServerLoad } from "../$types";
import { getTotalInventoryValue } from "$lib/utils/getTotalInventoryValue";
import { DrinkQuantityType, type Prisma } from "@prisma/client";
import { z } from "zod";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { redirect } from "@sveltejs/kit";
import dayjs from "dayjs";

type DrinkItemBatchWithItem = Prisma.DrinkItemBatchGetPayload<{
  include: { item: true };
}>;

const deleteSchema = z.object({
  id: z.string(),
});

const dateSchema = z.object({
  date: z.string().nullable(),
});

export const load: PageServerLoad = async (event) => {
  const { prisma } = event.locals;
  const date = event.url.searchParams.get("date");
  const deleteForm = await superValidate(zod(deleteSchema));
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

  type DrinkItemBatchWithItem = Prisma.DrinkItemBatchGetPayload<{
    include: { item: true };
  }>;

  const entriesOnDate =
    date == null
      ? entries
      : entries.filter((i) => dayjs(i.date).format("YYYY-MM-DD") === date!);

  const entriesToDate = entries;

  const totalInventoryValue =
    date == null
      ? (await getTotalInventoryValue(prisma)).totalInventoryValue / 100
      : totalInventoryValueToDate(entriesToDate);

  function totalInventoryValueToDate(entriesToDate: DrinkItemBatchWithItem[]) {
    let localTotalInventoryValue = 0;
    for (const row of entriesToDate) {
      if (row.item.quantityType === DrinkQuantityType.WEIGHT) {
        const fullRealWeight =
          row.item.bottleFullWeight! - row.item.bottleEmptyWeight!;
        const pricePerWeight = row.item.price / fullRealWeight;

        if (row.quantityIn === null) {
          const realWeight =
            (row.quantityOut ?? 0) - row.item.bottleEmptyWeight!;
          localTotalInventoryValue -= pricePerWeight * realWeight;
        } else {
          const realWeight =
            (row.quantityIn ?? 0) - row.item.bottleEmptyWeight!;
          localTotalInventoryValue += pricePerWeight * realWeight;
        }
      } else {
        if (row.quantityIn === null) {
          localTotalInventoryValue -= row.quantityOut! * row.item.price;
        } else {
          localTotalInventoryValue += row.quantityIn! * row.item.price;
        }
      }
    }
    return localTotalInventoryValue / 100;
  }

  return {
    entriesToDate,
    entriesOnDate,
    totalInventoryValue,
    deleteForm,
    dateForm,
  };
};

export const actions: Actions = {
  deleteEntry: async (event) => {
    const { prisma, user } = event.locals;

    const form = await superValidate(event.request, zod(deleteSchema));
    if (!form.valid) return fail(400, { form });

    await prisma.drinkItemBatch.delete({
      where: { id: form.data.id },
    });

    return message(form, { message: `Batch borttagen` });
  },

  redirectDate: async (event) => {
    const form = await superValidate(event.request, zod(dateSchema));

    if (!form.valid) return fail(400, { form });

    const date = dayjs(form.data.date).format("YYYY-MM-DD");
    event.url.searchParams.set("date", date);
    event.url.searchParams.delete("/redirectDate");
    redirect(302, event.url);
  },
};
