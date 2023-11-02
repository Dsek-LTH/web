import { getCurrentMemberId } from "$lib/utils/member";
import type { Session } from "@auth/core/types";
import type { AccessPolicy } from "@prisma/client";
import { error } from "@sveltejs/kit";
import prisma from "./prisma";
import { dev } from "$app/environment";

export type Context = Session["user"] | undefined;

export const verifyAccess = (
  policies: Pick<AccessPolicy, "studentId" | "role">[],
  context: Context
): boolean => {
  const roles = getRoleList(context);
  const studentId = context?.student_id ?? "";
  console.log(policies, context);

  return policies.some((p) => {
    if (p.studentId === studentId) return true;
    if (p.role && roles.includes(p.role)) return true;
    if (p.role === "_" && context?.student_id) return true; // logged in
    if (p.role === "*") return true;
    return false;
  });
};

export const hasAccess = async (
  apiName: string | string[],
  context: Context,
  relevantMemberId?: string
): Promise<boolean> => {
  // If asking for access where there is a relevant member id, check if said member is current user
  if (relevantMemberId && context?.student_id) {
    try {
      const memberId = await getCurrentMemberId(context);
      if (relevantMemberId === memberId) return true;
    } catch (e) {
      return false;
    }
  }
  // otherwise check for access
  const apiNames = typeof apiName === "string" ? [apiName] : apiName;
  // count the amount of policies giving the user access
  const validPolicyCount = await prisma.accessPolicy.count({
    where: {
      apiName: { in: apiNames },
      // user has access either through a role OR their student id
      OR: [
        {
          role: { in: getRoleList(context) },
        },
        {
          studentId: context?.student_id ?? "",
        },
      ],
    },
  });
  return validPolicyCount > 0;
};

export const policyAccessGuard = (apiName: string | string[], userAccessPolicies: string[]) => {
  const apiNames = typeof apiName === "string" ? [apiName] : apiName;
  if (userAccessPolicies.some((p) => apiNames.includes(p))) return;
  throw error(403, "You do not have permission, have you logged in?");
};

export const ctxAccessGuard = async (
  apiName: string | string[],
  context: Context,
  myMemberId?: string
) => {
  if (await hasAccess(apiName, context, myMemberId)) return;
  if (dev) {
    throw error(
      403,
      "You do not have permission, have you logged in? Required policies: " +
        (typeof apiName === "string" ? [apiName] : apiName).join(", ")
    );
  }
  throw error(403, "You do not have permission, have you logged in?");
};

export const withAccess = async <T>(
  apiName: string | string[],
  context: Context,
  fn: () => Promise<T>,
  myMemberId?: string
) => {
  await ctxAccessGuard(apiName, context, myMemberId);
  return fn();
};

// split all roles in group list. a group list might look like ["dsek.infu.mdlm", "dsek.ordf"] and this will split it into ["dsek", "dsek.infu", "dsek.infu.mdlm", "dsek.ordf"]
export const getRoleSet = (groupList: string[]) => {
  const splitGroups = new Set<string>();
  groupList.forEach((group) => {
    const groupParts = group.split(".");
    let currentGroup = "";
    groupParts.forEach((part) => {
      currentGroup = currentGroup ? `${currentGroup}.${part}` : part;
      splitGroups.add(currentGroup);
    });
  });
  splitGroups.add("*");
  return splitGroups;
};

export const getRoleList = (ctx: Context) => [
  ...getRoleSet(ctx?.group_list ? [...ctx.group_list, "_"] : []),
];

// Will return a list like ["news:create", "news:like", ...etc]
export const getUserApis = async (ctx: Context) => {
  const policies = await prisma.accessPolicy.findMany({
    where: {
      OR: [
        {
          role: { in: getRoleList(ctx) },
        },
        {
          studentId: ctx?.student_id ?? "",
        },
      ],
    },
  });
  return policies.map((p) => p.apiName);
};
