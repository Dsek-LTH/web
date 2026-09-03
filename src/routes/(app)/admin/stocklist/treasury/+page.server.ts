import type { Actions, PageServerLoad } from "../$types";
import { z } from "zod";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import dayjs from "dayjs";
import { redirect } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";

// drinkitembatch:update/delete (Go's apinames.DrinkItemBatchUpdate/Delete)
// are enforced by Go itself now (internal/stocklist.Service.UpdateBatch/
// DeleteBatch, which apply the item-quantity adjustment and the
// negative-total guard atomically in one transaction) - no authorize()
// call here, matching DESIGN.md's Principle #5. The old app's own
// duplicated negative-total math (once in updateEntry, once in
// deleteEntry) is gone from this file entirely - Go owns it.

const deleteSchema = z.object({
  id: z.string(),
});

const dateSchema = z.object({
  date: z.string().nullable(),
});

const updateSchema = z.object({
  id: z.string(),
  quantityDelta: z.number(),
  nrBottlesDelta: z.number(),
});

export const load: PageServerLoad = async (event) => {
  const date = event.url.searchParams.get("date");
  const deleteForm = await superValidate(zod4(deleteSchema));
  const updateForm = await superValidate(zod4(updateSchema));
  const dateForm = await superValidate(
    { date: date ?? null },
    zod4(dateSchema),
  );

  const res = await serverApi(event).GET("/drink-item-batches", {
    params: { query: date ? { beforeDate: date } : {} },
  });
  const entries = res.data ?? [];

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
    const form = await superValidate(event.request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });

    const res = await serverApi(event).PATCH("/drink-item-batches/{id}", {
      params: { path: { id: form.data.id } },
      body: {
        quantityDelta: form.data.quantityDelta,
        nrBottlesDelta: form.data.nrBottlesDelta,
      },
    });
    if (res.error) {
      return message(form, { message: "Totalt antal blir negativt" });
    }

    return message(form, { message: `Logg uppdaterad` });
  },

  deleteEntry: async (event) => {
    const form = await superValidate(event.request, zod4(deleteSchema));
    if (!form.valid) return fail(400, { form });

    const res = await serverApi(event).DELETE("/drink-item-batches/{id}", {
      params: { path: { id: form.data.id } },
    });
    if (res.error) {
      return message(form, { message: "Totalt antal blir negativt" });
    }
    return message(form, { message: `Logg borttagen` });
  },

  redirectDate: async (event) => {
    const form = await superValidate(event.request, zod4(dateSchema));

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
