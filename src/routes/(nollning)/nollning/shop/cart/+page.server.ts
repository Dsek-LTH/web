import cartActions from "$lib/server/shop/cart/actions.js";
import { cartLoadFunction } from "$lib/server/shop/cart/getCart";

export const load = cartLoadFunction;
export const actions = cartActions;
