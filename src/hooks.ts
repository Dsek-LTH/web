import "./dayjs-plugins";

import { browser, dev } from "$app/environment";
import type { Reroute } from "@sveltejs/kit";
import { deLocalizeUrl } from "$paraglide/runtime";

export const reroute: Reroute = (request) => {
  return deLocalizeUrl(request.url).pathname;
};

if (dev && browser) {
  localStorage.setItem("umami.disabled", "1"); // Disable usage tracking in dev mode
}

// Polyfill Object.groupBy
if (typeof Object.groupBy === typeof undefined) {
  Object.groupBy = <K extends PropertyKey, T>(
    items: Iterable<T>,
    keySelector: (item: T, index: number) => K,
  ): Partial<Record<K, T[]>> => {
    return Array.from(items).reduce((acc: Partial<Record<K, T[]>>, ...args) => {
      const key = keySelector(args[0], args[1]);
      acc[key] ??= [];
      acc[key].push(args[0]);
      return acc;
    }, {});
  };
}
