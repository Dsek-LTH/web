import apiNames, { flattenApiNames } from "$lib/utils/apiNames";
import { error } from "@sveltejs/kit";
import { api } from "$lib/api/client";
import type { PageLoad } from "./$types";

export type ApiNameEntry = {
  name: string;
  grantCount: number;
  inUse: boolean;
};

export const load: PageLoad = async (event) => {
  // Go returns every apiName that has at least one grant, with its count.
  const res = await api.GET("/access-policies/api-names", {
    fetch: event.fetch,
  });
  if (res.error)
    error(
      res.response.status,
      res.error.detail ?? "Failed to load access policies",
    );
  const grantCounts = new Map<string, number>(
    (res.data ?? []).map(({ apiName, grantCount }) => [apiName, grantCount]),
  );

  // Union of apiNames that already have a grant, and every apiName the
  // static registry declares (so admins can find & set up permissions
  // that don't have any policy yet, not just already-configured ones).
  const allNames = new Set([
    ...grantCounts.keys(),
    ...flattenApiNames(apiNames),
  ]);

  const apiNameList: ApiNameEntry[] = [...allNames].sort().map((name) => ({
    name,
    grantCount: grantCounts.get(name) ?? 0,
    inUse: grantCounts.has(name),
  }));

  return {
    apiNames: apiNameList,
  };
};
