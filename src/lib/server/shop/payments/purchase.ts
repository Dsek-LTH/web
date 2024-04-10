import { removeExpiredConsumables } from "$lib/server/shop/addToCart/reservations";
import { obtainStripeCustomer } from "$lib/server/shop/payments/customer";
import { getFullName } from "$lib/utils/client/member";
import {
  ShoppableType,
  type ItemQuestionResponse,
  type PrismaClient,
  type Shoppable,
} from "@prisma/client";
import authorizedPrismaClient from "../authorizedPrisma";
import { dbIdentification, type ShopIdentification } from "../types";
import {
  createPaymentIntent,
  creteConsumableMetadata,
  removePaymentIntent,
  updatePaymentIntent,
} from "./stripeMethods";

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
  const now = new Date();

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
    if (consumable.expiresAt && consumable.expiresAt < now) {
      await removeExpiredConsumables(prisma, new Date());
      throw new Error("En eller flera produkter i din kundvagn har löpt ut.");
    }
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
  const existingPaymentIntents = [];
  for (const consumable of userConsumables) {
    if (consumable.stripeIntentId) {
      const [intent, canTryAgain] = await updatePaymentIntent(
        consumable.stripeIntentId,
      );
      if (intent.status === "succeeded") modification = true;
      if (!canTryAgain) await removePaymentIntent(consumable.stripeIntentId);
      else existingPaymentIntents.push(intent.id);
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
      amount: priceWithTransactionFee(price),
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
    const existingDifferentPaymentIntents = existingPaymentIntents.filter(
      (id) => id !== intent.id,
    );
    if (existingDifferentPaymentIntents.length > 0) {
      await Promise.all(
        existingDifferentPaymentIntents.map((id) => removePaymentIntent(id)),
      );
    }
    try {
      // there is a race condition error here. If two calls to this method are done simultaneously, both will succeed, but one will be overwritten by another. COuld lead to an intent not connected to a consumable.
      await authorizedPrismaClient.$transaction(async (tx): Promise<void> => {
        // ensure all of the consumables are still without a stripeIntentId, and not removed
        const consumables = await tx.consumable.findMany({
          where: {
            id: {
              in: userConsumables.map((c) => c.id),
            },
            OR: [
              {
                stripeIntentId: null,
              },
              {
                stripeIntentId: {
                  equals: intent.id, // it's fine if its the same (might be due to idempotencyKey)
                },
              },
            ],
          },
        });
        if (consumables.length !== userConsumables.length) {
          console.log(intent.id, consumables, userConsumables);
          throw new Error("Du hade flera betalningar igång samtidigt.");
        }
        await tx.consumable.updateMany({
          where: {
            id: {
              in: userConsumables.map((c) => c.id),
            },
          },
          data: {
            stripeIntentId: intent.id,
            expiresAt: null, // should not expire while intent is active.
            // expiresAt should be set again when payment fails, intent is cancelled, or other stripe timeout (if it exists)
          },
        });
      });
    } catch (err) {
      await removePaymentIntent(intent.id);
      throw new Error(`Något gick fel: ${err}`);
    }
    return {
      clientSecret: intent.client_secret,
      message: "Du kan betala nu.",
      type: "hidden",
    };
  } catch (err) {
    throw new Error(`Något gick fel: ${err}`);
  }
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

// SWISH: 1% + 3kr (most common, cap of 7 kr fee)
// Cards: 1.5% + 1.8kr
// Klarna: 2.99% + 4kr
// It's illegal in the EU to charge a different amount depending on the user's choice of payment

// Because swish is most common, we use its fee as the one we charge the user. If they choose another option, the fee will be more, but that's fine I think.
const STRIPE_PERCENTAGE_FEE = 1 / 100; // 1%
const STRIPE_FIXED_FEE = 3; // 3 SEK
const STRIPE_PERCENTAGE_FEE_MODIFIER = 1 / (1 - STRIPE_PERCENTAGE_FEE); // 1/(1-0.015) i.e. 1.5%
/**
 * Calculates the transaction fee for a given price.
 */
export const transactionFee = (price: number) =>
  price * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE;

/**
 * Calculates the required price to charge the user for us to receive `price` after Stripe takes its cut.
 */
export const priceWithTransactionFee = (price: number) =>
  (price + STRIPE_FIXED_FEE) * STRIPE_PERCENTAGE_FEE_MODIFIER;

export default purchaseCart;
