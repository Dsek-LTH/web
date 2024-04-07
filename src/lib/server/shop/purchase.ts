import { ShoppableType, type PrismaClient } from "@prisma/client";
import { dbIdentification, type ShopIdentification } from "./types";
import authorizedPrismaClient from "./authorizedPrisma";

const clearOutConsumablesAfterSellingOut = async (
  soldOutShoppableIds: string[],
) => {
  await authorizedPrismaClient.$transaction(async (tx) => {
    await tx.consumable.deleteMany({
      where: {
        shoppableId: {
          in: soldOutShoppableIds,
        },
        purchasedAt: null,
      },
    });
    await tx.consumableReservation.deleteMany({
      where: {
        shoppableId: {
          in: soldOutShoppableIds,
        },
      },
    });
  });
};

const purchaseCart = async (
  prisma: PrismaClient,
  identification: ShopIdentification,
) => {
  const soldOutShoppableIds: string[] = [];
  try {
    // Step 1: Get all consumables in the user's cart
    const userConsumables = await prisma.consumable.findMany({
      where: {
        ...dbIdentification(identification),
        purchasedAt: null,
      },
      include: {
        shoppable: {
          include: {
            ticket: true,
            _count: {
              select: {
                consumables: {
                  where: {
                    purchasedAt: {
                      not: null,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    // Step 2: Check if the consumables are still available (should not happen but you never know I guess)
    for (const consumable of userConsumables) {
      if (
        consumable.shoppable.type === ShoppableType.TICKET &&
        consumable.shoppable._count.consumables >=
          (consumable.shoppable.ticket?.stock ?? 0)
      ) {
        soldOutShoppableIds.push(consumable.shoppable.id);
        throw new Error("Biljetten blev slutsåld under köpet"); // with our reservation system, this shouldn't happen, but it's just a safety measure
      }
    }
  } catch (e) {
    if (soldOutShoppableIds.length > 0) {
      await clearOutConsumablesAfterSellingOut(soldOutShoppableIds);
    }
    throw e;
  }
  if (soldOutShoppableIds.length > 0) {
    await clearOutConsumablesAfterSellingOut(soldOutShoppableIds);
  }
  // STEPS:
  // Step 3: Create stripe session and request
  // Step 4: Store stripe session in the database (connected to consumables)
  // Step 4: Send stripe session for frontend to show
};

const handleStripePayment = async () => {
  // STEPS:
  // Step 1: Verify the payment
  // Step 2: Update the consumables to be purchased
};

export default purchaseCart;
