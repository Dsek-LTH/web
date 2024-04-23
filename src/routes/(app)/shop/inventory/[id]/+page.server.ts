import { dbIdentification } from "$lib/server/shop/types";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, depends, params }) => {
  const { prisma, user } = locals;
  const { memberId, externalCode } = user ?? {};
  if (!memberId && !externalCode) {
    error(401, "Du måste logga in för att se din kista");
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
    error(404, "Hittade inte produkten");
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
