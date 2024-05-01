import { dbIdentification } from "$lib/server/shop/types";
import { error } from "@sveltejs/kit";
import * as m from "$paraglide/messages";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, depends, params }) => {
  const { prisma, user } = locals;
  const { memberId, externalCode } = user ?? {};
  if (!memberId && !externalCode) {
    error(401, m.inventory_errors_unauthorized());
  }
  const userId = dbIdentification(
    memberId
      ? {
          memberId,
        }
      : {
          externalCode: externalCode!,
        },
  );
  depends("consumables");
  const consumable = await prisma.consumable.findUnique({
    where: {
      ...userId,
      id: params.id,
      purchasedAt: {
        not: null,
        lte: new Date(),
      },
    },
    include: {
      shoppable: {
        include: {
          ticket: {
            include: { event: true },
          },
        },
      },
    },
  });
  if (!consumable) {
    error(404, m.inventory_errors_consumableNotFound());
  }
  return {
    consumable: {
      ...consumable,
      shoppable: {
        ...consumable.shoppable,
        ...consumable.shoppable.ticket!,
        event: consumable.shoppable.ticket!.event,
      },
    },
  };
};
