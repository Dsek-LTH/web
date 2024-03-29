import type { Cart, PrismaClient } from "@prisma/client";
import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { randomUUID } from "crypto";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  const productCategories = await prisma.productCategory.findMany({
    where: {
      deletedAt: null,
    },
  });

  const products = await prisma.product.findMany({
    where: {
      // deletedAt: null, @TODO remove this when webshop is finished
    },
    include: {
      productInventories: true,
    },
  });

  const myCart = await prisma.cart.findFirst({
    where: {
      studentId: user?.studentId,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      items: {
        include: {
          productInventory: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          productInventoryId: "desc",
        },
      },
    },
  });
  const myInventory = await prisma.userInventory.findFirst({
    where: {
      studentId: user?.studentId,
    },
    include: {
      userInventoryItems: true,
    },
  });
  return {
    productCategories,
    products,
    myCart,
    myInventory,
  };
};

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

const CART_EXPIRY_MINUTES = 30;

const TRANSACTION_COST = 2;

export const actions: Actions = {
  addToCart: async ({ request, locals }) => {
    const { prisma, user } = locals;
    try {
      if (!user?.studentId) throw new Error("You are not logged in");
      const data = await request.formData();
      const productInventoryId = data.get("productInventoryId");
      if (!productInventoryId || typeof productInventoryId !== "string") {
        throw new Error("Invalid product inventory id");
      }
      let myCart = await prisma.cart.findFirst({
        where: {
          studentId: user.studentId,
          expiresAt: {
            gt: new Date(),
          },
        },
      });
      if (!myCart) {
        myCart = await prisma.cart.create({
          data: {
            studentId: user.studentId,
            expiresAt: addMinutes(new Date(), CART_EXPIRY_MINUTES),
            totalPrice: 0,
            totalQuantity: 0,
          },
        });
      }
      const productInventory = await inventoryToCartTransaction(
        prisma,
        productInventoryId,
        1,
        myCart,
      );
      return {
        success: true,
        productInventory,
      };
    } catch (e) {
      let message;
      if (e instanceof Error) message = e.message;
      else message = String(e);
      console.log(e);
      return fail(400, { error: message });
    }
  },
  removeFromCart: async ({ request, locals }) => {
    const { prisma, user } = locals;
    try {
      if (!user?.studentId) throw new Error("You are not logged in");
      const data = await request.formData();
      const productInventoryId = data.get("productInventoryId");
      if (!productInventoryId || typeof productInventoryId !== "string") {
        throw new Error("Invalid product inventory id");
      }
      const myCart = await prisma.cart.findFirst({
        where: {
          studentId: user.studentId,
          expiresAt: {
            gt: new Date(),
          },
        },
      });
      if (!myCart) throw new Error("Cart not found");
      const productInventory = await cartToInventoryTransaction(
        prisma,
        productInventoryId,
        1,
        myCart.id,
      );
      return {
        success: true,
        productInventory,
      };
    } catch (e) {
      let message;
      if (e instanceof Error) message = e.message;
      else message = String(e);
      console.log(e);
      return fail(400, { error: message });
    }
  },
};

async function cartToInventoryTransaction(
  prisma: PrismaClient,
  productInventoryId: string,
  quantity: number,
  cartId: string,
) {
  await prisma.$transaction(async (trx) => {
    const cartItem = await trx.cartItem.update({
      where: {
        cartId: cartId,
        productInventoryId,
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

    if (!cartItem) throw new Error("Item not in cart");

    if (cartItem.quantity === 0) {
      await trx.cartItem.delete({
        where: { id: cartItem.id },
      });
    }

    const inventory = await trx.productInventory.findUnique({
      where: { id: productInventoryId },
      include: {
        product: true,
      },
    });

    if (!inventory)
      throw new Error(`Inventory with id ${productInventoryId} not found`);

    await trx.productInventory.update({
      where: { id: productInventoryId },
      data: { quantity: { increment: quantity } },
    });

    await trx.cart.update({
      where: { id: cartId },
      data: {
        totalPrice: {
          decrement: quantity * inventory.product.price,
        },
        totalQuantity: {
          decrement: quantity,
        },
      },
    });
    await trx.cart.updateMany({
      where: {
        id: cartId,
        totalQuantity: 0,
      },
      data: {
        totalPrice: 0,
      },
    });

    const updatedCart = await prisma.cart.findUnique({
      where: {
        id: cartId,

        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!updatedCart) throw new Error("Failed to update cart");

    return updatedCart;
  });
}

async function inventoryToCartTransaction(
  prisma: PrismaClient,
  productInventoryId: string,
  quantity: number,
  cart: Cart,
) {
  const transactionId = randomUUID();
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
      throw new Error(
        `Product with id ${updatedInventory.productId} not found`,
      );
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
      if (
        userInventoryQuantity + cartItem.quantity + quantity >
        product.maxPerUser
      ) {
        throw new Error("You already have the maximum amount of this product.");
      }

      cartItem = await trx.cartItem.update({
        where: { id: cartItem.id },
        data: {
          quantity: {
            increment: quantity,
          },
        },
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

    /**
     * @TODO use a different system to determine if there's supposed to be a transaction cost, this is not good.
     */
    // Update cart total price and quantity
    const diffTransactionCost =
      cart.totalPrice === 0 && product.price > 0 ? TRANSACTION_COST : 0;

    await trx.cart.update({
      where: { id: cart.id },
      data: {
        totalPrice: {
          increment: product.price * quantity + diffTransactionCost,
        },
        totalQuantity: {
          increment: quantity,
        },
      },
    });

    // Log the transaction
    console.log(
      `Transaction ${transactionId}: ${cart.studentId} added ${quantity} ${product.name} to cart.`,
    );

    return cartItem;
  });

  return result;
}
