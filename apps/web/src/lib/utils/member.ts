import type { components } from "$lib/api/schema";
import type { serverApi } from "$lib/server/apiClient";
import type { NumericRange } from "@sveltejs/kit";

/**
 * Puts the member in phadder group groupId, or takes them out of their
 * group if groupId is null. Does nothing if that's the group they're
 * already in, or if the form didn't post the field (undefined): the forms
 * post the field whether or not the caller may see or change it, so an
 * unchanged value must never reach Go. That includes a group from an
 * earlier season: the select doesn't offer it, but its hidden input still
 * posts the prefilled id, which then matches. Pass the member's profile
 * as Go returned it (e.g. from the profile PUT) to compare against
 * without fetching it again. Returns Go's error, if any.
 */
export const setNollningGroup = async (
  api: ReturnType<typeof serverApi>,
  studentId: string,
  groupId: string | null | undefined,
  profile?: Pick<components["schemas"]["MemberProfile"], "nollningGroupId">,
): Promise<{ status: NumericRange<400, 599>; message: string } | null> => {
  if (groupId === undefined) return null;
  const params = { path: { studentId } };

  // Go only shows nollningGroupId to those who may change it; for anyone
  // else it's missing, matching the form's empty select.
  let current = profile;
  if (!current) {
    const currentRes = await api.GET("/members/{studentId}", { params });
    if (currentRes.error)
      return {
        status: currentRes.response.status as NumericRange<400, 599>,
        message: currentRes.error.detail ?? currentRes.response.statusText,
      };
    current = currentRes.data;
  }
  if ((current.nollningGroupId ?? null) === (groupId ?? null)) return null;

  const res = await api.PUT("/members/{studentId}/phadder-group", {
    params,
    body: groupId ? { groupId } : {},
  });
  if (res.error)
    return {
      status: res.response.status as NumericRange<400, 599>,
      message: res.error.detail ?? res.response.statusText,
    };
  return null;
};
