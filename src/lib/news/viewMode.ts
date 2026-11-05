export const NEWS_VIEW_COOKIE = "news_view";

export const newsViewModes = ["cards", "list"] as const;
export type NewsViewMode = (typeof newsViewModes)[number];

export const DEFAULT_NEWS_VIEW: NewsViewMode = "cards";

export const isNewsViewMode = (value: unknown): value is NewsViewMode =>
  newsViewModes.includes(value as NewsViewMode);

export const parseNewsViewMode = (value: string | undefined): NewsViewMode =>
  isNewsViewMode(value) ? value : DEFAULT_NEWS_VIEW;

/**
 * Persist the chosen view mode in a cookie so the server can render the
 * right view on the next visit without a layout flash.
 * Path is "/" because the page is also served under localized prefixes (e.g. /en/news).
 */
export const saveNewsViewMode = (mode: NewsViewMode) => {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${NEWS_VIEW_COOKIE}=${mode}; path=/; max-age=${oneYear}; SameSite=Lax`;
};
