import { page } from "$app/state";

/**
 * Inline `bottom` for a sticky action bar inside the native app, keeping it
 * clear of the app's bottom navigation. On the website it's undefined and the
 * bar relies on `stickyBottomClass` instead.
 */
export const getStickyBottomOffset = () =>
  page.data.isApp
    ? `${(page.data.appInfo?.insets?.bottom ?? 0) + 64}px`
    : undefined;

/** Keeps a sticky action bar above the website's mobile bottom navigation. */
export const stickyBottomClass = "bottom-16 md-nav:bottom-0";
