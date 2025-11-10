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
  drinkItemId: z.string().default(""),
  quantity: z.number().default(0),
  weight: z.number().default(0),
  inOut: z.string().default(""),
});

export const actions: Actions = {
  createDrinkItemBatch: async (event) => {
    const { user, prisma } = event.locals;

    authorize(apiNames.DRINKITEMBATCH.CREATE, user);
    const form = await superValidate(event.request, zod(DrinkItemBatchSchema));
    if (!form.valid) return fail(400, { form });

    // Get the drink item to check if it's a spirit
    const drinkItem = await prisma.drinkItem.findUnique({
      where: { id: form.data.drinkItemId },
    });

    if (!drinkItem) {
      return fail(400, { form, message: "Drink item not found" });
    }

    // Calculate quantity based on whether it's a spirit or not
    let finalQuantity: number;

    if (
      drinkItem.weight &&
      drinkItem.emptyWeight &&
      form.data.weight &&
      form.data.weight > 0
    ) {
      // It's a spirit - calculate spirit volume from weight
      finalQuantity = form.data.weight - drinkItem.emptyWeight;
      if (finalQuantity <= 0) {
        return fail(400, {
          form,
          message: "Vikten måste vara större än tom flaskans vikt",
        });
      }
    } else if (form.data.quantity && form.data.quantity > 0) {
      // Regular item - use quantity directly
      finalQuantity = form.data.quantity;
    } else {
      return fail(400, { form, message: "Quantity or weight required" });
    }

    console.log(form.data.inOut);
    console.log(form.data.drinkItemId);
    console.log("Final quantity:", finalQuantity);

    if (form.data.inOut == "IN") {
      await prisma.drinkItemBatch.create({
        data: {
          drinkItemId: form.data.drinkItemId,
          quantity: finalQuantity,
        },
      });

      return message(form, {
        message: drinkItem.weight ? "Sprit inskriven" : "Antal inskrivet",
      });
    }

    if (form.data.inOut == "OUT") {
      await prisma.$transaction(async (tx) => {
        const drinkItemId = form.data.drinkItemId;
        const requested = finalQuantity;

        if (requested <= 0) {
          throw new Error("Quantity must be greater than 0.");
        }

        // Fetch all batches for this item with stock, oldest first (FIFO)
        const batches = await tx.drinkItemBatch.findMany({
          where: {
            drinkItemId,
            quantity: { gt: 0 },
          },
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
      return message(form, {
        message: drinkItem.weight ? "Sprit utskriven" : "Antal utskrivet",
      });
    }
  },
};

// HÄMTA ALLA DRINK ITEMS

// SKAPA EN FUNCTION FÖR ATT SKRIVA IN

// SKAPA EN FUNCTION FÖR ATT SKRIVA UT
