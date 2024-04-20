import { SECRET_STRIPE_KEY } from "$env/static/private";
import Stripe from "stripe";

// initialize Stripe
const stripe = new Stripe(SECRET_STRIPE_KEY);
export default stripe;
