import { dev } from "$app/environment";
import { getCurrentMemberId } from "$lib/utils/member";
import type { Session } from "@auth/core/types";
import { Prisma, type AccessPolicy, type Member } from "@prisma/client";
import { error, type HttpError } from "@sveltejs/kit";
import type { SuperValidated, ZodValidation } from "sveltekit-superforms";
import type { NumericRange } from "sveltekit-superforms/dist/utils";
import { message } from "sveltekit-superforms/server";
import type { AnyZodObject } from "zod";
import prisma from "./prisma";

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
  relevantMember?: Pick<Member, "id"> | Pick<Member, "studentId">
): Promise<boolean> => {
  // If we're in development mode and we're signed in, give full access rights.
  if (dev && context?.student_id) return true;
  // If asking for access where there is a relevant member id, check if said member is current user
  if (relevantMember && context?.student_id) {
    try {
      if ("studentId" in relevantMember) {
        if (relevantMember.studentId === context?.student_id) return true;
      } else {
        const memberId = await getCurrentMemberId(context);
        if (memberId === relevantMember.id) return true;
      }
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
  relevantMember?: Pick<Member, "id"> | Pick<Member, "studentId">
) => {
  if (await hasAccess(apiName, context, relevantMember)) return;
  if (dev) {
    throw error(
      403,
      "You do not have permission, have you logged in? Required policies: " +
        (typeof apiName === "string" ? [apiName] : apiName).join(", ")
    );
  }
  throw error(403, "You do not have permission, have you logged in?");
};

export const withAccess = async <
  T,
  Schema extends ZodValidation<AnyZodObject>,
  F extends SuperValidated<Schema>,
>(
  apiName: string | string[],
  context: Context,
  fn: () => Promise<T>,
  form: F,
  relevantMember?: Pick<Member, "id"> | Pick<Member, "studentId">
) => {
  try {
    await ctxAccessGuard(apiName, context, relevantMember);
    return await fn();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // return fail(400, { form, error: e.message });
      // throw error(400, { message: e.message });
      console.log("Prisma error", e);
      return message(
        form,
        {
          // message: e.message,
          message: "instanceof",
          type: "error",
        },
        {
          status: 400,
        }
      );
    } else if (
      "status" in (e as HttpError) &&
      "body" in (e as HttpError) &&
      "message" in (e as HttpError).body
    ) {
      console.log("Http error", e);
      // return fail((e as HttpError).status, { form, error: (e as HttpError).body.message });
      // throw error((e as HttpError).status, { message: (e as HttpError).body.message });
      return message(
        form,
        {
          // message: (e as HttpError).body.message,
          message: "http error",
          type: "error",
        },
        {
          status: (e as HttpError).status as NumericRange<400, 599>,
        }
      );
    }
    console.warn("Unknown error occured", e);
    // return fail(500, { form, error: "Unknown error" });
    throw e;
  }
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
  // If we're running in development mode and we're signed in, give all available roles to the user.
  if (dev && ctx?.student_id) {
    const policies = await prisma.accessPolicy.findMany({
      distinct: "apiName",
    });
    return policies.map((p) => p.apiName);
  }
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
