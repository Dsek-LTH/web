import { getCurrentMemberId } from "$lib/member";
import prisma from "$lib/prisma";
import type { Session } from "@auth/core/types";
import type { AccessPolicy } from "@prisma/client";
import { error } from "@sveltejs/kit";

export type Context = Session["user"] | undefined;

export const verifyAccess = (
  policies: Pick<AccessPolicy, "studentId" | "role">[],
  context: Context
): boolean => {
  const roles = context?.group_list ?? [];
  const studentId = context?.student_id ?? "";

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
  const apiNames = typeof apiName === "string" ? [apiName] : apiName;
  const policies = await prisma.accessPolicy.findMany({
    where: {
      apiName: { in: apiNames },
    },
  });
  // Check if logged in user actually owns the referenced id
  if (relevantMemberId && context?.student_id) {
    try {
      const memberId = await getCurrentMemberId(context);
      if (relevantMemberId === memberId) return true;
    } catch (e) {
      return false;
    }
  }
  if (verifyAccess(policies, context)) return true;
  return false;
};

export const accessGuard = async (
  apiName: string | string[],
  context: Context,
  myMemberId?: string
) => {
  if (await hasAccess(apiName, context, myMemberId)) return;
  throw error(403, {
    message: "You do not have permission, have you logged in?",
    statusDescription: "Unauthorized",
  });
};

export const withAccess = async <T>(
  apiName: string | string[],
  context: Context,
  fn: () => Promise<T>,
  myMemberId?: string
) => {
  if (await hasAccess(apiName, context, myMemberId)) return fn();
  throw error(403, {
    message: "You do not have permission, have you logged in?",
    statusDescription: "Unauthorized",
  });
};

// split all roles in group list. a group list might look like ["dsek.infu.mdlm", "dsek.ordf"] and this will split it into ["dsek", "dsek.infu", "dsek.infu.mdlm", "dsek.ordf"]
export const splitGroupList = (groupList: string[]) => {
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

export const getUserApis = async (ctx: Context) => {
  const policies = await prisma.accessPolicy.findMany({
    where: {
      role: {
        in: [...splitGroupList(ctx?.group_list ? [...ctx.group_list, "_"] : [])],
      },
    },
  });
  return policies.map((p) => p.apiName);
};
