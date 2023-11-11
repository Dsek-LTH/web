import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import type { Cart } from "@prisma/client";
import type { PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";

let transactions = 0;

const generateTransactionId = () => {
  transactions += 1;
  return transactions;
};

export const load: PageServerLoad = async () => {
  const productCategories = await prisma.productCategory.findMany({
    where: {
      deletedAt: null,
    },
  });

  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      productInventories: true,
    },
  });

  return {
    productCategories,
    products,
  };
};

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

const CART_EXPIRY_MINUTES = 30;

const TRANSACTION_COST = 2;

export const actions = {
  addToCart: async ({ request, locals }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.NEWS.CREATE, session?.user, async () => {
      try {
        if (!session?.user?.student_id) throw new Error("You are not logged in");
        const data = await request.formData();
        const productInventoryId = data.get("productInventoryId");
        if (!productInventoryId || typeof productInventoryId !== "string") {
          throw new Error("Invalid product inventory id");
        }
        let myCart = await prisma.cart.findFirst({
          where: { studentId: session.user.student_id },
        });
        if (!myCart) {
          myCart = await prisma.cart.create({
            data: {
              studentId: session.user.student_id,
              expiresAt: addMinutes(new Date(), CART_EXPIRY_MINUTES),
              totalPrice: 0,
              totalQuantity: 0,
            },
          });
        }
        const productInventory = await processTransaction(productInventoryId, 1, myCart);
        return {
          success: true,
          productInventory,
        };
      } catch (e: any) {
        console.log(e);
        return fail(400, { error: e.message });
      }
    });
  },
};

async function processTransaction(productInventoryId: string, quantity: number, cart: Cart) {
  const transactionId = generateTransactionId();
  const result = await prisma.$transaction(async (trx) => {
    // Decrement inventory quantity
    const inventory = await trx.productInventory.updateMany({
      where: {
        id: productInventoryId,
        quantity: {
          gte: quantity,
        },
      },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });

    if (!inventory.count) {
      throw new Error("Not enough items in stock");
    }

    // Fetch the updated inventory
    const updatedInventory = await trx.productInventory.findUnique({
      where: { id: productInventoryId },
    });

    if (!updatedInventory) {
      throw new Error(`Inventory with id ${productInventoryId} not found`);
    }

    // Fetch the product
    const product = await trx.product.findUnique({
      where: { id: updatedInventory.productId },
    });

    if (!product) {
      throw new Error(`Product with id ${updatedInventory.productId} not found`);
    }

    if (new Date(product.releaseDate) > new Date()) {
      throw new Error("Product not released yet");
    }

    // Fetch or create cart item
    let cartItem = await trx.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productInventoryId: productInventoryId,
      },
    });

    const userInventoryQuantity = await trx.userInventoryItem.count({
      where: {
        studentId: cart.studentId,
        productInventoryId: productInventoryId,
      },
    });

    if (cartItem) {
      if (userInventoryQuantity + cartItem.quantity + quantity > product.maxPerUser) {
        throw new Error("You already have the maximum amount of this product.");
      }

      cartItem = await trx.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: cartItem.quantity + quantity },
      });
    } else {
      if (userInventoryQuantity + quantity > product.maxPerUser) {
        throw new Error("You already have the maximum amount of this product.");
      }

      cartItem = await trx.cartItem.create({
        data: {
          cartId: cart.id,
          productInventoryId: productInventoryId,
          quantity,
        },
      });
    }

    // Update cart total price and quantity
    const diffTransactionCost = cart.totalPrice === 0 && product.price > 0 ? TRANSACTION_COST : 0;

    await trx.cart.update({
      where: { id: cart.id },
      data: {
        totalPrice: cart.totalPrice + product.price * quantity + diffTransactionCost,
        totalQuantity: cart.totalQuantity + quantity,
      },
    });

    // Log the transaction
    console.log(
      `Transaction ${transactionId}: ${cart.studentId} added ${quantity} ${product.name} to cart.`
    );

    return cartItem;
  });

  return result;
}
