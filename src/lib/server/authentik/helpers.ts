import type { Pagination } from "@goauthentik/api";

// We define a generic for request parameters that must include an optional page
export interface PaginatedRequestParams {
  page?: number;
}

// We define a generic paginated list structure
export interface PaginatedList<T> {
  pagination: Pagination;
  results: T[];
}

/**
 * Fetches all pages of a paginated resource.
 *
 * @template T The type of the items in the results array (e.g., User).
 * @template P The type of the request parameters object, which must be compatible with { page?: number }.
 * @param fetchFunction A function that takes request parameters and returns a promise of a paginated list.
 * @param initialParams The initial request parameters (without the `page` property, which will be managed by this function).
 * @returns A promise that resolves to an array containing all items from all pages.
 */
export async function fetchAll<T, P extends PaginatedRequestParams>(
  fetchFunction: (params: P) => Promise<PaginatedList<T>>,
  initialParams: P = {} as P,
): Promise<T[]> {
  // 1. Make the initial call to get the first page and total page count
  const firstPageResponse = await fetchFunction({
    ...initialParams,
    page: 1,
  } as P);
  const allResults = [...firstPageResponse.results];
  const totalPages = firstPageResponse.pagination.totalPages;

  // If there's only one page, we're done
  if (totalPages <= 1) {
    return allResults;
  }

  // 2. Create an array of promises for the remaining pages
  const pagePromises: Array<Promise<PaginatedList<T>>> = [];
  for (let page = 2; page <= totalPages; page++) {
    const paramsForPage = { ...initialParams, page };
    pagePromises.push(fetchFunction(paramsForPage as P));
  }

  // 3. Execute all promises in parallel
  const remainingPagesResponses = await Promise.all(pagePromises);

  // 4. Concatenate the results from the remaining pages
  for (const response of remainingPagesResponses) {
    allResults.push(...response.results);
  }

  return allResults;
}
