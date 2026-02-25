import { PUBLIC_PURCHASE_PASS_ON_TRANSACTION_FEE } from "$env/static/public";

export const passOnTransactionFee =
	PUBLIC_PURCHASE_PASS_ON_TRANSACTION_FEE === "true";
// SWISH: 1% + 3kr (most common, cap of 7 kr fee)
// Cards: 1.5% + 1.8kr
// Klarna: 2.99% + 4kr
// It's illegal in the EU to charge a different amount depending on the user's choice of payment

// Because swish is most common, we use its fee as the one we charge the user. If they choose another option, the fee will be more, but that's fine I think.
const STRIPE_PERCENTAGE_FEE = 1 / 100; // 1%
const STRIPE_FIXED_FEE = 300; // 3 SEK
const STRIPE_PERCENTAGE_FEE_MODIFIER = 1 / (1 - STRIPE_PERCENTAGE_FEE); // 1/(1-0.015) i.e. 1.5%
/**
 * Calculates the transaction fee for a given price.
 */
export const transactionFee = (price: number) => swishTransactionFee(price);

export const cardTranscationFee = (price: number) =>
	price === 0 ? 0 : Math.floor(price * 0.015 + 180);
export const swishTransactionFee = (price: number) =>
	price === 0 ? 0 : Math.min(Math.floor(price * 0.01 + 300), 700);

/**
 * Calculates the required price to charge the user for us to receive `price` after Stripe takes its cut.
 */
export const priceWithTransactionFee = (price: number) =>
	price === 0
		? 0
		: Math.floor((price + STRIPE_FIXED_FEE) * STRIPE_PERCENTAGE_FEE_MODIFIER);
