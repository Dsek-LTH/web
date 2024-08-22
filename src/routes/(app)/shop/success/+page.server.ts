import stripeCallbackLoad from "$lib/server/shop/payments/paymentCallback";

// This page is duplicated for /nollning

export const load = stripeCallbackLoad("/shop/inventory");
