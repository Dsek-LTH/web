import { getFullName } from "$lib/utils/client/member";
import {
  ShoppableType,
  type ItemQuestionResponse,
  type PrismaClient,
  type Shoppable,
} from "@prisma/client";
import authorizedPrismaClient from "./authorizedPrisma";
import {
  createPaymentIntent,
  creteConsumableMetadata,
  updatePaymentIntent,
} from "./stripeMethods";
import { dbIdentification, type ShopIdentification } from "./types";
import { obtainStripeCustomer } from "$lib/server/shop/customer";

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
  idempotencyKey: string,
) => {
  const soldOutShoppableIds: string[] = [];
  // Step 1: Get all consumables in the user's cart
  const userConsumables = await prisma.consumable.findMany({
    where: {
      ...dbIdentification(identification),
      purchasedAt: null,
    },
    include: {
      questionResponses: true,
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
  if (userConsumables.length === 0) {
    throw new Error("Din kundvagn är tom.");
  }
  // Step 2: Check if the consumables are still available (should not happen but you never know I guess)
  for (const consumable of userConsumables) {
    if (
      consumable.shoppable.type === ShoppableType.TICKET &&
      consumable.shoppable._count.consumables >=
        (consumable.shoppable.ticket?.stock ?? 0)
    ) {
      soldOutShoppableIds.push(consumable.shoppable.id);
    }
  }
  if (soldOutShoppableIds.length > 0) {
    await clearOutConsumablesAfterSellingOut(soldOutShoppableIds);
    throw new Error("Biljetten blev slutsåld under köpet"); // with our reservation system, this shouldn't happen, but it's just a safety measure
  }

  let modification = false;
  for (const consumable of userConsumables) {
    if (consumable.stripeIntentId) {
      const intent = await updatePaymentIntent(consumable.stripeIntentId);
      if (intent.status === "succeeded") modification = true;
    }
  }
  if (modification) {
    return {
      message:
        "En (eller flera) av produkterna i din kundvagn har redan betalats för, din kundvagn har uppdaterats och berörda produkter är köpta.",
      type: "success",
    };
  }

  // Step 3: Calculate price
  const price = calculateCartPrice(userConsumables);
  if (price <= 0) {
    await authorizedPrismaClient.consumable.updateMany({
      where: {
        id: {
          in: userConsumables.map((c) => c.id),
        },
        shoppable: {
          // in case any price is negative we filter by price=0.
          // A product's price should never be negative, but we check just in case.
          // We do not want to give away another product for free accidentally.
          price: 0,
        },
      },
      data: {
        purchasedAt: new Date(),
      },
    });
    return {
      message: "Dina gratisprodukter i kundvagnen har blivit köpta.",
      type: "success",
    };
  }

  const member = identification.memberId
    ? await prisma.member.findUnique({
        where: {
          id: identification.memberId,
        },
      })
    : null;
  const customer = member ? await obtainStripeCustomer(member) : null;

  // Step 4: Create stripe payment intent
  try {
    const intent = await createPaymentIntent({
      amount: price + transactionFee(price),
      customer: customer?.id ?? undefined,
      metadata: {
        isAnonymousUser: !member ? "true" : "false", // metadata can only be string or number
        customerStudentId: member ? member.studentId : null,
        customerName: member
          ? getFullName({
              ...member,
              nickname: null,
            })
          : null,
        ...creteConsumableMetadata(userConsumables),
      },
      idempotencyKey: idempotencyKey, // makes sure if user presses button twice, only one payment intent is created
    });
    await prisma.consumable.updateMany({
      where: {
        id: {
          in: userConsumables.map((c) => c.id),
        },
      },
      data: {
        stripeIntentId: intent.id,
      },
    });
    return {
      clientSecret: intent.client_secret,
      message: "Du kan betala nu.",
      type: "hidden",
    };
  } catch (err) {
    throw new Error(`Något gick fel: ${err}`);
  }
  // STEPS:
  // Step 3: Create stripe session and request
  // Step 4: Store stripe session in the database (connected to consumables)
  // Step 4: Send stripe session for frontend to show
};

type ConsumableFieldsForPrice = {
  shoppable: Pick<Shoppable, "price">;
  questionResponses: Array<Pick<ItemQuestionResponse, "extraPrice">>;
};
export const calculateConsumablePrice = (
  consumable: ConsumableFieldsForPrice,
) =>
  consumable.shoppable.price +
  consumable.questionResponses.reduce((a, c) => a + (c.extraPrice ?? 0), 0);

export const calculateCartPrice = (consumables: ConsumableFieldsForPrice[]) =>
  consumables.reduce(
    (acc, consumable) =>
      acc +
      calculateConsumablePrice({
        shoppable: consumable.shoppable,
        questionResponses: consumable.questionResponses,
      }),
    0,
  );

const STRIPE_PERCENTAGE_FEE_MODIFIER = 1.0152284264; // 1/(1-0.015) i.e. 1.5%
const STRIPE_FIXED_FEE = 180; // 1.8 SEK
export const transactionFee = (price: number) =>
  (price + STRIPE_FIXED_FEE) * STRIPE_PERCENTAGE_FEE_MODIFIER;

export default purchaseCart;
