import { api } from "$lib/api/client";
import type { PageLoad } from "./$types";

/**
 * Same data as /elections — the guide surfaces the currently open elections
 * inline so a new student doesn't have to know that page exists.
 */
export const load: PageLoad = async ({ fetch }) => {
  const res = await api.GET("/elections", { fetch });
  return { openElections: res.data ?? [] };
};
