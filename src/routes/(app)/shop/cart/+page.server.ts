import cartActions from "$lib/server/shop/cart/actions";
import { cartLoadFunction } from "$lib/server/shop/cart/getCart";

// This is such a simple page because it is duplicated for /nollning as well.

export const load = cartLoadFunction;
export const actions = cartActions;
