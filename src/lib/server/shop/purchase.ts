import { SECRET_STRIPE_KEY } from "$env/static/private";
import {
  ShoppableType,
  type ItemQuestionResponse,
  type PrismaClient,
  type Shoppable,
} from "@prisma/client";
import Stripe from "stripe";
import authorizedPrismaClient from "./authorizedPrisma";
import { dbIdentification, type ShopIdentification } from "./types";

// initialize Stripe
const stripe = new Stripe(SECRET_STRIPE_KEY);

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

  // Step 3: Calculate price
  const price = calculateCartPrice(userConsumables);
  if (price <= 0) {
    // TODO: Handle consumables as if they cost something and set them to purchased
  }

  // Step 4: Create stripe payment intent
  try {
    const intent = await stripe.paymentIntents.create(
      {
        amount: price + transactionFee(price),
        currency: "SEK",
        automatic_payment_methods: {
          enabled: true,
        },
        description: "D-sek webshop purchase",
      },
      {
        idempotencyKey: idempotencyKey,
      },
    );
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

const handleStripePayment = async () => {
  // STEPS:
  // Step 1: Verify the payment
  // Step 2: Update the consumables to be purchased
};

export default purchaseCart;
