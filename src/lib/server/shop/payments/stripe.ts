import { env } from "$env/dynamic/private";
import Stripe from "stripe";

// initialize Stripe
const stripe = new Stripe(env.SECRET_STRIPE_KEY);
export default stripe;
