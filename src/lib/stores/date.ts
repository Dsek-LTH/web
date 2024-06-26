import { readable } from "svelte/store";

/**
 * Store for the current date, updated every second
 */
export const now = readable(new Date(), (set) => {
  set(new Date());

  const interval = setInterval(() => {
    set(new Date());
  }, 1000);

  return () => clearInterval(interval);
});
