import { fail } from "@sveltejs/kit";
import {
  type Infer,
  message,
  superValidate,
} from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import * as m from "$paraglide/messages";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const positions = await prisma.position.findMany({
    include: {
      committee: true,
    },
  });

  const updateForms = Object.fromEntries(
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
  active: z.boolean().optional(),
  boardMember: z.boolean(),
});
export type UpdatePositionAttributeSchema = Infer<typeof updateSchema>;

export const actions: Actions = {
  update: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(updateSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.position.update({
      where: { id: form.data.id },
      data: {
        active: form.data.active,
        boardMember: form.data.boardMember,
      },
    });
    return message(form, {
      message: m.positions_positionUpdated(),
      type: "success",
    });
  },
};
