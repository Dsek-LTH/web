import type { Actions, PageServerLoad } from "../$types";
import { getTotalInventoryValue } from "$lib/utils/getTotalInventoryValue";
import { DrinkQuantityType, type Prisma } from "@prisma/client";
import { z } from "zod";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { redirect } from "@sveltejs/kit";
import dayjs from "dayjs";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";

const deleteSchema = z.object({
  id: z.string(),
});

const dateSchema = z.object({
  date: z.string().nullable(),
});

const updateSchema = z.object({
  id: z.string(),
  date: z.string(),
  drinkItemId: z.string(),
  quantityIn: z.number().min(0),
  quantityOut: z.number().min(0),
});

export const load: PageServerLoad = async (event) => {
  const { prisma } = event.locals;
  const drinks = await prisma.drinkItem.findMany();
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
            row.quantityOut! - row.item.bottleEmptyWeight! * row.nrBottles!;
          console.log(realWeight);
          localTotalInventoryValue -= pricePerWeight * realWeight;
        } else {
          const realWeight =
            (row.quantityIn ?? 0) -
            row.item.bottleEmptyWeight! * row.nrBottles!;
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
    updateForm,
    dateForm,
    drinks,
  };
};

export const actions: Actions = {
  deleteEntry: async (event) => {
    const { prisma, user } = event.locals;
    const form = await superValidate(event.request, zod(deleteSchema));

    if (!form.valid) return fail(400, { form });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.drinkItemBatch.delete({
          where: { id: form.data.id },
        });

        const inventoryResult = await getTotalInventoryValue(prisma);

        if (inventoryResult.totalInventoryValue < 0) {
          throw new Error("INVENTORY_NEGATIVE");
        }

        const productStock = new Map<string, number>();

        for (const batch of inventoryResult.grouped) {
          const itemId = batch.item.id;

          const quantity = (batch.quantityIn ?? 0) - (batch.quantityOut ?? 0);

          const currentTotal = productStock.get(itemId) || 0;
          productStock.set(itemId, currentTotal + quantity);
        }

        for (const [itemId, stock] of productStock) {
          if (stock < 0) {
            throw new Error("PRODUCT_NEGATIVE");
          }
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === "INVENTORY_NEGATIVE") {
        return message(form, { message: `Totalvärde blir negativt` });
      } else if (
        error instanceof Error &&
        error.message === "PRODUCT_NEGATIVE"
      ) {
        return message(form, { message: `Mängd av produkt blir negativt` });
      }

      console.error(error);
      return fail(500, { form });
    }

    return message(form, { message: `Batch borttagen` });
  },

  updateEntry: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateSchema));

    if (!form.valid) return fail(400, { form });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.drinkItemBatch.delete({
          where: { id: form.data.id },
        });

        const inventoryResult = await getTotalInventoryValue(prisma);

        if (inventoryResult.totalInventoryValue < 0) {
          throw new Error("INVENTORY_NEGATIVE");
        }

        const productStock = new Map<string, number>();

        for (const batch of inventoryResult.grouped) {
          const itemId = batch.item.id;

          const quantity = (batch.quantityIn ?? 0) - (batch.quantityOut ?? 0);

          const currentTotal = productStock.get(itemId) || 0;
          productStock.set(itemId, currentTotal + quantity);
        }

        for (const [itemId, stock] of productStock) {
          if (stock < 0) {
            throw new Error("PRODUCT_NEGATIVE");
          }
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === "INVENTORY_NEGATIVE") {
        return message(form, { message: `Totalvärde blir negativt` });
      } else if (
        error instanceof Error &&
        error.message === "PRODUCT_NEGATIVE"
      ) {
        return message(form, { message: `Mängd av produkt blir negativt` });
      }

      console.error(error);
      return fail(500, { form });
    }

    try {
      await prisma.drinkItemBatch.update({
        where: { id: form.data.id },
        data: {
          date: new Date(form.data.date),
          drinkItemId: form.data.drinkItemId,
          quantityIn: form.data.quantityIn,
          quantityOut: form.data.quantityOut,
        },
      });
    } catch (err) {
      return fail(500, { message: "Failed to update" });
    }

    redirect(302, request.url);
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
