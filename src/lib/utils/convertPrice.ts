/**
 * @param price in kr
 * @returns price in öre
 *
 * @example
 * convertPriceToCents(123.45) => 12345
 */
export const convertPriceToCents = (price: number) => {
  return Math.round(price * 100);
};
