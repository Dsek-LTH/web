import { zod4 } from "sveltekit-superforms/adapters";
import type { Actions, PageServerLoad } from "../$types";
import { z } from "zod";
import { fail, message, superValidate } from "sveltekit-superforms";
import { serverApi } from "$lib/server/apiClient";

// drinkitem:delete/update (Go's apinames.DrinkItemDelete/Update) are
// enforced by Go itself now (internal/stocklist.Service.Delete/Update) -
// no authorize() call here, matching DESIGN.md's Principle #5. The old
// deleteEntry action's "still in stock" message came from catching
// Prisma's own FK-violation error; Go returns the equivalent as a real 400
// with a message now (Service.isForeignKeyViolation), surfaced below the
// same way.

const zDrinkGroup = z.enum(["S1", "S2", "S3", "S4"]);

const deleteSchema = z.object({
  id: z.string(),
});

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number(),
  systembolagetID: z.number().int(),
  bottleEmptyWeight: z.number().int(),
  bottleFullWeight: z.number().int(),
  group: zDrinkGroup,
});

export const load: PageServerLoad = async (event) => {
  const res = await serverApi(event).GET("/drink-items", {});
  const drinkItems = (res.data ?? []).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const deleteForm = await superValidate(zod4(deleteSchema));
  const updateForm = await superValidate(zod4(updateSchema));

  return { drinkItems, deleteForm, updateForm };
};

export const actions: Actions = {
  deleteEntry: async (event) => {
    const form = await superValidate(event.request, zod4(deleteSchema));
    if (!form.valid) return fail(400, { form });

    const res = await serverApi(event).DELETE("/drink-items/{id}", {
      params: { path: { id: form.data.id } },
    });
    if (res.error) {
      return message(form, { message: `Produkt finns i lager` });
    }

    return message(form, { message: `Produkt borttagen` });
  },

  updateEntry: async (event) => {
    const form = await superValidate(event.request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });

    const res = await serverApi(event).PATCH("/drink-items/{id}", {
      params: { path: { id: form.data.id } },
      body: {
        name: form.data.name,
        systembolagetId: form.data.systembolagetID,
        price: form.data.price,
        group: form.data.group,
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
    return message(form, { message: `Produkt uppdaterad` });
  },
};
