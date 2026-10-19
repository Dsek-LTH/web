export type BookingViewFilter = "all" | "my";

export const BOOKING_QUERY_PARAMS = {
  category: "category",
  mine: "mine",
} as const;

export const getBookingViewFilter = (
  searchParams: URLSearchParams,
): BookingViewFilter =>
  searchParams.has(BOOKING_QUERY_PARAMS.mine) ? "my" : "all";

export const isMineFilterActive = (searchParams: URLSearchParams): boolean =>
  getBookingViewFilter(searchParams) === "my";

export const getCategoryFilterValue = (
  searchParams: URLSearchParams,
  defaultCategoryValue: string,
): string =>
  searchParams.get(BOOKING_QUERY_PARAMS.category) ?? defaultCategoryValue;

export const setBookingViewFilter = (
  url: URL,
  filter: BookingViewFilter,
): void => {
  if (filter === "all") {
    url.searchParams.delete(BOOKING_QUERY_PARAMS.mine);
  } else {
    url.searchParams.set(BOOKING_QUERY_PARAMS.mine, "1");
  }
};

export const setCategoryFilter = (
  url: URL,
  category: string,
  defaultCategoryValue: string,
): void => {
  if (category === defaultCategoryValue) {
    url.searchParams.delete(BOOKING_QUERY_PARAMS.category);
  } else {
    url.searchParams.set(BOOKING_QUERY_PARAMS.category, category);
  }
};
