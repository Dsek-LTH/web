import { error, fail } from "@sveltejs/kit";
import {
  message,
  setError,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import authentik from "$lib/server/authentik";
import * as m from "$paraglide/messages";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const { prisma } = locals;
  const positions = await prisma.position.findMany({
    include: {
      committee: true,
    },
  });

  let updateForms = Object.fromEntries(
    positions.map((pos) => [
      pos.id,
      superValidate(pos, zod(updateSchema), { id: pos.id }),
    ]),
  );

  return {
    updateForms,
    positions: positions,
  };
};

const updateSchema = z.object({
  id: z.string(),
  active: z.boolean(),
  isBoardMember: z.boolean(),
});
export type UpdatePositionAttributeSchema = Infer<typeof updateSchema>;

export const actions: Actions = {
  update: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateSchema));
    if (!form.valid) return fail(400, { form });
    console.log(form.data);
    await prisma.position.update({
      where: { id: form.data.id },
      data: {
        active: form.data.active,
        boardMember: form.data.isBoardMember,
      },
    });
    return message(form, {
      message: m.positions_positionUpdated(),
      type: "success",
    });
  },
};
