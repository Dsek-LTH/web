import apiNames, { flattenApiNames } from "$lib/utils/apiNames";
import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";
import type { PageServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";

export type ApiNameEntry = {
  name: string;
  grantCount: number;
  inUse: boolean;
};

export const load: PageServerLoad = async (event) => {
  const { locals } = event;
  const { user } = locals;
  authorize(apiNames.ACCESS_POLICY.CREATE, user);

  // Go returns every apiName that has at least one grant, with its count.
  const res = await serverApi(event).GET("/access-policies/api-names", {});
  if (res.error) throw error(500, "Failed to load access policies");
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
