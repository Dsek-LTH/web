import type { Actions } from "@sveltejs/kit";
import { superValidate, fail, message } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import { serverApi } from "$lib/server/apiClient";

// drinkitem:create (Go's apinames.DrinkItemCreate) is enforced by Go
// itself now (internal/stocklist.Service.Create) - no authorize() call
// here, matching DESIGN.md's Principle #5.

const zDrinkGroup = z.enum(["S1", "S2", "S3", "S4"]);
const zDrinkQuantityType = z.enum(["NONE", "WEIGHT", "COUNTS"]);

export const load: PageServerLoad = async (event) => {
  const form = await superValidate(event.request, zod4(DrinkItemSchema));

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
    const form = await superValidate(event.request, zod4(DrinkItemSchema));
    if (!form.valid) return fail(400, { form });

    const res = await serverApi(event).POST("/drink-items", {
      body: {
        quantityType: form.data.quantityType,
        name: form.data.name,
        price: form.data.price,
        group: form.data.group,
        systembolagetId: form.data.systembolagetID,
        bottleEmptyWeight: form.data.bottleEmptyWeight,
        bottleFullWeight: form.data.bottleFullWeight,
      },
    });
    if (res.error) {
      return message(
        form,
        { message: res.error.detail ?? res.error.title ?? "", type: "error" },
        { status: 400 },
      );
    }

    return message(form, { message: "Produkt tillagd" });
  },
};
