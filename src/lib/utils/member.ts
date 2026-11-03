import type { serverApi } from "$lib/server/apiClient";

/**
 * Puts the member in nolla group groupId, or takes them out of their
 * current one if groupId is null.
 */
export const setNollningGroup = async (
  api: ReturnType<typeof serverApi>,
  studentId: string,
  groupId: string | null,
) => {
  if (groupId) {
    await api.POST("/nollning/groups/{id}/nollor", {
      params: { path: { id: groupId } },
      body: { studentIds: [studentId] },
    });
    return;
  }

  const roleRes = await api.GET("/members/{studentId}/phadder-role", {
    params: { path: { studentId } },
  });
  const currentGroupId =
    roleRes.data?.role === "nolla" ? roleRes.data.groupId : undefined;
  if (currentGroupId) {
    await api.DELETE("/nollning/groups/{id}/nollor/{studentId}", {
      params: { path: { id: currentGroupId, studentId } },
    });
  }
};
