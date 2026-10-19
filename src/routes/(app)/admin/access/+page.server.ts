import apiNames, { flattenApiNames } from "$lib/utils/apiNames";
import type { PageServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";

export type ApiNameEntry = {
  name: string;
  grantCount: number;
  inUse: boolean;
};

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.ACCESS_POLICY.CREATE, user);

  const policies = await prisma.accessPolicy.findMany({
    select: { apiName: true },
  });
  const grantCounts = new Map<string, number>();
  for (const { apiName: name } of policies) {
    grantCounts.set(name, (grantCounts.get(name) ?? 0) + 1);
  }

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
