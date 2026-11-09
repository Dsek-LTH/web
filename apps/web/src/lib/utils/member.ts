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
    await api.POST("/nollning/phadder-groups/{id}/nollor", {
      params: { path: { id: groupId } },
      body: { studentIds: [studentId] },
    });
    return;
  }

  // The member's nolla group in any season, not only the current one.
  const profileRes = await api.GET("/members/{studentId}", {
    params: { path: { studentId } },
  });
  const currentGroupId = profileRes.data?.nollaIn?.id;
  if (currentGroupId) {
    await api.DELETE("/nollning/phadder-groups/{id}/nollor/{studentId}", {
      params: { path: { id: currentGroupId, studentId } },
    });
  }
};
