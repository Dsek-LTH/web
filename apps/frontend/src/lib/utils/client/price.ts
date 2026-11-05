const formatter = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const formatPrice = (price: number) => {
  return formatter.format(price / 100);
};

export const priceFormatClasses = "font-semibold text-success";
