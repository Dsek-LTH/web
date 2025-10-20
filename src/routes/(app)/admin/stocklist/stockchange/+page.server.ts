import type { Actions } from "@sveltejs/kit";
import { superValidate, fail, message } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

export const load: PageServerLoad = async (event) => {
  const { prisma } = event.locals;
  const form = await superValidate(event.request, zod(DrinkItemBatchSchema));
  const drinks = await prisma.drinkItem.findMany();
  return { form, drinks };
};

const DrinkItemBatchSchema = z.object({
  drinkItemId: z.string(),
  bestBeforeDate: z.string(),
  quantity: z.number(),
  inOut: z.string(),
});

export const actions: Actions = {
  createDrinkItemBatch: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.DRINKITEMBATCH.CREATE, user);
    const form = await superValidate(event.request, zod(DrinkItemBatchSchema));
    if (!form.valid) return fail(400, { form });

    if (form.data.inOut == "IN") {
      await prisma.drinkItemBatch.create({
        data: {
          drinkItemId: form.data.drinkItemId,
          quantity: form.data.quantity,
          bestBeforeDate: form.data.bestBeforeDate,
        },
      });
      return message(form, { message: "Antal inskrivet" });
    }
    if (form.data.inOut == "OUT") {
      await prisma.$transaction(async (tx) => {
        const drinkItemId = form.data.drinkItemId;
        const requested = form.data.quantity;

        if (requested <= 0) {
          throw new Error("Quantity must be greater than 0.");
        }

        // Fetch all batches for this item with stock, oldest first (FIFO)
        const batches = await tx.drinkItemBatch.findMany({
          where: {
            drinkItemId,
            quantity: { gt: 0 },
          },
          orderBy: [{ bestBeforeDate: "asc" }, { id: "asc" }], // oldest first
        });

        const available = batches.reduce((sum, b) => sum + b.quantity, 0);

        if (available < requested) {
          throw new Error(
            `Not enough stock for drinkItemId=${drinkItemId}. Requested: ${requested}, available: ${available}.`,
          );
        }

        // Deduct across batches FIFO
        let remaining = requested;

        for (const batch of batches) {
          if (remaining === 0) break;

          const take = Math.min(batch.quantity, remaining);

          await tx.drinkItemBatch.update({
            where: { id: batch.id },
            data: {
              quantity: { decrement: take }, // atomic
            },
          });

          remaining -= take;
        }
      });
      return message(form, { message: "Antal utskrivet" });
    }
  },
};

// HÄMTA ALLA DRINK ITEMS

// SKAPA EN FUNCTION FÖR ATT SKRIVA IN

// SKAPA EN FUNCTION FÖR ATT SKRIVA UT
