export const NOLLNING_TAG_PREFIX = "[NOLLNING]";
export const POST_REVEAL_PREFIX = "/nollning";

export const REVEAL_LAUNCH_DATE = new Date("2025-08-27T14:00:00"); // NEEDS TO BE UPDATED EVERY YEAR
export const APP_PREFERRED_PAGE_COOKIE = "APP-preferred-page";

// they will check if a link starts with one of these and then redirect to nollning copy
export const OVERRIDEN_POST_REVEAL_ROUTES = [
  { from: "/shop/tickets", to: `${POST_REVEAL_PREFIX}/events` },
  { from: "/shop/cart" },
  { from: "/shop/inventory" },
  { from: "/shop/success" },
  { from: "/settings" },
];
