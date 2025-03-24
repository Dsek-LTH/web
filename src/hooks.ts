import "./dayjs-plugins";

import { i18n } from "$lib/utils/i18n";
export const reroute = i18n.reroute();

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
