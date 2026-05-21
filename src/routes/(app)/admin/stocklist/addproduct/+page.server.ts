import { DrinkQuantityType, DrinkGroup } from "@prisma/client";
import type { Actions } from "@sveltejs/kit";
import { superValidate, fail, message } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";

const zDrinkGroup = z.nativeEnum(DrinkGroup);
const zDrinkQuantityType = z.nativeEnum(DrinkQuantityType);

export const load: PageServerLoad = async (event) => {
  const form = await superValidate(event.request, zod(DrinkItemSchema));

  form.data.quantityType = "COUNTS";
  return { form };
};

const DrinkItemSchema = z.object({
  quantityType: zDrinkQuantityType,
  name: z.string().min(1),
  price: z.number(),
  group: zDrinkGroup,
  systembolagetID: z.number().int(),
  bottleEmptyWeight: z.number().int(),
  bottleFullWeight: z.number().int(),
});

export const actions: Actions = {
  createDrinkItem: async (event) => {
    const { user, prisma } = event.locals;
    authorize(apiNames.DRINKITEM.CREATE, user);
    const form = await superValidate(event.request, zod(DrinkItemSchema));
    if (!form.valid) return fail(400, { form });

    await prisma.drinkItem.create({
      data: {
        quantityType: form.data.quantityType,
        name: form.data.name,
        price: form.data.price * 100,
        group: form.data.group,
        systembolagetID: form.data.systembolagetID,
        bottleEmptyWeight: form.data.bottleEmptyWeight,
        bottleFullWeight: form.data.bottleFullWeight,
      },
    });

    return message(form, { message: "Produkt tillagd" });
  },
};
