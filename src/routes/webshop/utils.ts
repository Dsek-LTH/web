import type {
  Cart,
  CartItem,
  Product,
  ProductInventory,
  UserInventory,
  UserInventoryItem,
} from "@prisma/client";

export function getMyQuantity(
  product: (Product & { productInventories: ProductInventory[] }) | null,
  cart: (Cart & { items: CartItem[] }) | null,
  chest:
    | (UserInventory & {
        userInventoryItems: UserInventoryItem[];
      })
    | null
) {
  const productInventoryIds = product?.productInventories.map((p) => p.id) ?? [];
  const cartItems = cart?.items.filter((p) => productInventoryIds.includes(p.productInventoryId));
  const chestItems = chest?.userInventoryItems.filter((p) => p.productId === product?.id);
  //console.log(chestItems);
  //console.log(cart);
  let inCart = 0;
  let inChest = 0;
  if (cartItems?.length) {
    inCart = cartItems.reduce((acc, cur) => acc + cur.quantity, 0);
  }
  if (chestItems?.length) {
    inChest = chestItems.length;
  }
  return {
    total: inCart + inChest,
    inCart,
    inChest,
  };
}
