import { error } from "@sveltejs/kit";
import * as m from "$paraglide/messages";
import {
  dateToSemester,
  parseSemesterFromString,
  type Semester,
} from "$lib/utils/semesters";

interface Options {
  fallbackValue: number;
  lowerBound: number;
  upperBound: number;
  errorMessage: string;
}

/**
 * Get `year` from the URL search params or throw a Svelte error if `year` is invalid.
 * If `year` is not set, the default is the current year.
 * @param url The URL object
 * @param options The options for the function. Default is `{ fallbackValue: new Date().getFullYear(), lowerBound: 1982, upperBound: new Date().getFullYear(), errorMessage: m.error_invalid_year() }`
 * @returns `year`, or the {@link fallbackValue} if `year` is not set
 * @throws Svelte error if `year` is invalid
 */
export const getYearOrThrowSvelteError = (
  url: URL,
  options?: Partial<Options>,
) => {
  return getIntegerParamOrThrowSvelteError(url, "year", {
    fallbackValue: options?.fallbackValue ?? new Date().getFullYear(),
    lowerBound: options?.lowerBound ?? 1982,
    upperBound: options?.upperBound ?? new Date().getFullYear(),
    errorMessage: options?.errorMessage ?? m.error_invalid_year(),
  });
};

/**
 * Get `page` from the URL search params or throw a Svelte error if `page` is invalid.
 * If `page` is not set, the default is 1.
 * @param url The URL object
 * @param options The options for the function. Default is `{ fallbackValue: 1, lowerBound: 1, upperBound: Number.MAX_SAFE_INTEGER, errorMessage: m.error_invalid_page() }`
 * @returns `page`, or the {@link fallbackValue} if `page` is not set
 * @throws Svelte error if `page` is invalid
 */
export const getPageOrThrowSvelteError = (
  url: URL,
  options?: Partial<Options>,
) => {
  return getIntegerParamOrThrowSvelteError(url, "page", {
    fallbackValue: options?.fallbackValue ?? 1,
    lowerBound: options?.lowerBound ?? 1,
    upperBound: options?.upperBound ?? Number.MAX_SAFE_INTEGER,
    errorMessage: options?.errorMessage ?? m.error_invalid_page(),
  });
};

/**
 * Get `pageSize` from the URL search params or throw a Svelte error if `pageSize` is invalid
 * If `pageSize` is not set, the default is 10.
 * @param url The URL object
 * @param options The options for the function. Default is `{ fallbackValue: 10, lowerBound: 1, upperBound: 100, errorMessage: m.error_invalid_page_size() }`
 * @returns `pageSize`, or the {@link fallbackValue} if `pageSize` is not set
 * @throws Svelte error if `pageSize` is invalid
 */
export const getPageSizeOrThrowSvelteError = (
  url: URL,
  options?: Partial<Options>,
) => {
  return getIntegerParamOrThrowSvelteError(url, "pageSize", {
    fallbackValue: options?.fallbackValue ?? 10,
    lowerBound: options?.lowerBound ?? 1,
    upperBound: options?.upperBound ?? 100,
    errorMessage: options?.errorMessage ?? m.error_invalid_page_size(),
  });
};

/**
 * Get an integer parameter from the URL object or throw a Svelte error if the parameter is invalid.
 * If the parameter is not set, the default is the fallback value.
 * @param url The URL object
 * @param param The parameter to get
 * @param options The options for the function.
 * @returns The parameter, or the {@link fallbackValue} if the parameter is not set
 * @throws Svelte error if the parameter is invalid
 */
export const getIntegerParamOrThrowSvelteError = (
  url: URL,
  param: string,
  options: Options,
): number => {
  const value = parseInt(
    url.searchParams.get(param) || options.fallbackValue.toString(),
  );
  if (isNaN(value)) throw error(400, options.errorMessage);
  if (value < options.lowerBound || value > options.upperBound) {
    throw error(400, options.errorMessage);
  }
  return value;
};

export const getSemesterOrThrowSvelteError = (
  url: URL,
  fallbackValue = dateToSemester(new Date()),
): Semester => {
  const semester = url.searchParams.get("semester");
  if (semester === null) return fallbackValue;
  const parsed = parseSemesterFromString(
    semester,
    () => error(400, m.error_invalid_semester()),
  );
  return parsed;
};
