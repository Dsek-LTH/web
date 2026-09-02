import { error, fail } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import * as m from "$paraglide/messages";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const res = await serverApi(event).GET("/positions", {});
  if (res.error) throw error(500, "Failed to load positions");
  const positions = res.data ?? [];

  const updateForms = Object.fromEntries(
    positions.map((pos) => [
      pos.id,
      superValidate(pos, zod4(updateSchema), { id: pos.id }),
    ]),
  );

  return {
    updateForms,
    positions,
  };
};

const updateSchema = z.object({
  id: z.string(),
  active: z.boolean().optional(),
  boardMember: z.boolean(),
});
export type UpdatePositionAttributeSchema = Infer<typeof updateSchema>;

export const actions: Actions = {
  update: async (event) => {
    const api = serverApi(event);
    const form = await superValidate(event.request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });

    // Full-replace: fetch the current position so its name/email/description
    // fields aren't wiped by this active/boardMember-only form.
    const currentRes = await api.GET("/positions/{id}", {
      params: { path: { id: form.data.id } },
    });
    if (currentRes.error) return fail(404, { form });
    const current = currentRes.data;

    const res = await api.PATCH("/positions/{id}", {
      params: { path: { id: form.data.id } },
      body: {
        nameSv: current.nameSv ?? "",
        nameEn: current.nameEn,
        email: current.email,
        descriptionSv: current.descriptionSv,
        descriptionEn: current.descriptionEn,
        active: form.data.active ?? current.active ?? true,
        boardMember: form.data.boardMember,
      },
    });
    if (res.error) return fail(500, { form });

    return message(form, {
      message: m.positions_positionUpdated(),
      type: "success",
    });
  },
};
