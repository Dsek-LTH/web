import { env } from "$env/dynamic/private";
import Stripe from "stripe";

let stripe: Stripe | undefined;

export const getStripe = (): Stripe => {
  if (!stripe) {
    const apiKey = env.SECRET_STRIPE_KEY;
    if (!apiKey) {
      throw new Error("Missing SECRET_STRIPE_KEY environment variable");
    }

    stripe = new Stripe(apiKey);
  }

  return stripe;
};
