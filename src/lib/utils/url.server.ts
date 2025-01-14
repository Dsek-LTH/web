import { error } from "@sveltejs/kit";
import * as m from "$paraglide/messages";

/**
 * Get the year from the URL object or throw a Svelte error if the year is invalid
 * @param url The URL object
 * @param lowerBound The lower bound for the year. Default is 1982
 * @param upperBound The upper bound for the year. Default is the current year
 * @returns The year
 * @throws Svelte error if the year is invalid
 */
export const getYearOrThrowSvelteError = (
  url: URL,
  lowerBound = 1982,
  upperBound = new Date().getFullYear(),
) => {
  const year = parseInt(
    url.searchParams.get("year") || new Date().getFullYear().toString(),
  );
  if (isNaN(year)) throw error(400, m.error_invalid_year());
  if (year < lowerBound || year > upperBound) {
    throw error(400, m.error_invalid_year());
  }
  return year;
};
