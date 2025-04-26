import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";
import * as m from "$paraglide/messages";

/**
 * Check if the user is authorized to perform an action.
 * @returns Whether the user is authorized.
 */
export const isAuthorized = (
  apiName: string,
  user: AuthUser | undefined,
): boolean => {
  if (dev && !!user?.studentId) return true;
  if (user?.policies.includes(apiName)) return true;
  return false;
};

/**
 * Authorize a user to perform an action or a list of actions.
 * @throws {HttpError} If the user is not authorized.
 */
export const authorize = (
  apiName: string | string[],
  user: AuthUser | undefined,
) => {
  const apiNames = Array.isArray(apiName) ? apiName : [apiName];
  for (const name of apiNames) {
    if (!isAuthorized(name, user)) {
      error(403, `${m.errors_missingPermissions()} ${name}`);
    }
  }
};

/**
 * Derive all roles from the group list.
 * @param groupList e.g. `["dsek.infu.mdlm", "dsek.ordf"]`
 * @param signedIn Whether the user is signed in. If `groupList` contains groups, the user is assumed to be signed in.
 * @returns e.g. `["*", "_", "dsek", "dsek.infu", "dsek.infu.mdlm", "dsek.ordf"]`
 */
export const getDerivedRoles = (
  groupList?: string[],
  signedIn = false,
  classYear: number | undefined = undefined,
) => {
  const splitGroups = new Set<string>();
  groupList?.forEach((group) =>
    group
      .split(".")
      .forEach((_, i, arr) => splitGroups.add(arr.slice(0, i + 1).join("."))),
  );
  splitGroups.add("*"); // all users
  if (groupList?.length || signedIn) splitGroups.add("_"); // logged in users
  if (classYear && classYear === new Date().getFullYear())
    splitGroups.add("nolla");
  return [...splitGroups];
};
