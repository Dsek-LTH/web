import type { Actions } from "@sveltejs/kit";
import { fail, message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import { serverApi } from "$lib/server/apiClient";
import dayjs from "dayjs";

// drinkitembatch:create (Go's apinames.DrinkItemBatchCreate) is enforced
// by Go itself now (internal/stocklist.Service.CreateBatch) - no
// authorize() call here, matching DESIGN.md's Principle #5. Go's single
// POST /drink-item-batches endpoint replaces the old app's separate
// createInBatch/createOutBatch Prisma writes - direction is now just the
// sign of quantityDelta/nrBottlesDelta (negative for "out"), matching the
// drinkitembatch table's own signed-delta column semantics directly; see
// backend/CLAUDE.md's Admin routes section.

export const load: PageServerLoad = async (event) => {
  const inForm = await superValidate(zod4(createInBatchSchema));
  const outForm = await superValidate(zod4(createOutBatchSchema));
  const res = await serverApi(event).GET("/drink-items", {});
  const drinkItems = (res.data ?? []).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return { inForm, outForm, drinkItems };
};

const createOutBatchSchema = z.object({
  drinkItemId: z.string(),
  quantityDelta: z.number().nonnegative(),
  date: z
    .string()
    .date()
    .default(() => new Date().toLocaleDateString("se-SE")),
  nrBottles: z.number().nonnegative().default(0),
});

const createInBatchSchema = z.object({
  drinkItemId: z.string(),
  quantityDelta: z.number().nonnegative(),
  date: z
    .string()
    .date()
    .default(() => new Date().toLocaleDateString("se-SE")),
  nrBottles: z.number().nonnegative().default(0),
});

export const actions: Actions = {
  createInBatch: async (event) => {
    const form = await superValidate(event.request, zod4(createInBatchSchema));
    if (!form.valid) return fail(400, { form });

    if (form.data.quantityDelta === 0) {
      return message(form, { message: "Får inte vara 0" });
    }

    const res = await serverApi(event).POST("/drink-item-batches", {
      body: {
        drinkItemId: form.data.drinkItemId,
        quantityDelta: form.data.quantityDelta,
        nrBottlesDelta: form.data.nrBottles,
        date: dayjs(form.data.date).toISOString(),
      },
    });
    if (res.error) {
      return message(form, {
        message: res.error.detail ?? res.error.title ?? "",
      });
    }
    return message(form, { message: "Antal inskrivet" });
  },

  createOutBatch: async (event) => {
    const form = await superValidate(
      event.request,
      zod4(createOutBatchSchema),
    );
    if (!form.valid) return fail(400, { form });

    if (form.data.quantityDelta === 0) {
      return message(form, { message: "Får inte vara 0" });
    }

    const res = await serverApi(event).POST("/drink-item-batches", {
      body: {
        drinkItemId: form.data.drinkItemId,
        quantityDelta: -form.data.quantityDelta,
        nrBottlesDelta: -form.data.nrBottles,
        date: dayjs(form.data.date).toISOString(),
      },
    });
    if (res.error) {
      return message(form, { message: "Finns inte tillräckligt i lager" });
    }

    return message(form, { message: "Antal utskrivet" });
  },
};
