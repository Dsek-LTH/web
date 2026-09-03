import { serverApi } from "$lib/server/apiClient";
import { fail } from "sveltekit-superforms";
import type { Actions, PageServerLoad } from "./$types";

// drinkitem:create (Go's apinames.DrinkItemCreate) is enforced by Go
// itself now (internal/stocklist.Service.ImportCSV) - a real fix, not a
// replicated gap: the old readFile action had no authorize() call at all,
// see backend/CLAUDE.md's Admin routes section. Reading the list/inventory
// value stays ungated, matching the old ZModel's @@allow("read", true).

export const load: PageServerLoad = async (event) => {
  const api = serverApi(event);
  const [itemsRes, valueRes] = await Promise.all([
    api.GET("/drink-items", { params: { query: { availableOnly: true } } }),
    api.GET("/drink-items/inventory-value", {}),
  ]);

  return {
    currentInventoryValue: valueRes.data?.value ?? 0,
    drinkItems: itemsRes.data ?? [],
  };
};

export const actions: Actions = {
  readFile: async (event) => {
    const form = await event.request.formData();
    const file = form.get("upload");

    if (!(file instanceof File)) {
      return fail(400, { message: "No file uploaded" });
    }

    const body = new FormData();
    body.append("file", file);
    const res = await serverApi(event).POST("/drink-items/import", {
      body: body as unknown as { file: string },
    });
    if (res.error) {
      return fail(400, { message: res.error.detail ?? res.error.title ?? "" });
    }

    return {
      success: true,
      message: `Produkter skapade`,
    };
  },
};
