import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";

/**
 * Check if the user is authorized to perform an action.
 * @returns Whether the user is authorized.
 */
export const isAuthorized = (apiName: string, user?: AuthUser): boolean => {
  if (dev) return true;
  if (user?.policies.includes(apiName)) return true;
  return false;
};

/**
 * Authorize a user to perform an action.
 * @throws {HttpError} If the user is not authorized.
 */
export const authorize = (apiName: string, user?: AuthUser) => {
  if (!isAuthorized(apiName, user)) {
    throw error(
      403,
      `You do not have permission, have you logged in? Required policy: ${apiName}`,
    );
  }
};

/**
 * Derive all roles from the group list.
 * @param groupList e.g. `["dsek.infu.mdlm", "dsek.ordf"]`
 * @returns e.g. `["*", "_", "dsek", "dsek.infu", "dsek.infu.mdlm", "dsek.ordf"]`
 */
export const getDerivedRoles = (groupList?: string[]) => {
  const splitGroups = new Set<string>();
  groupList?.forEach((group) =>
    group
      .split(".")
      .forEach((_, i, arr) => splitGroups.add(arr.slice(0, i + 1).join("."))),
  );
  splitGroups.add("*"); // all users
  if (groupList?.length) splitGroups.add("_"); // logged in users
  return [...splitGroups];
};
