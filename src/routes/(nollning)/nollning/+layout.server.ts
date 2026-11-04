import { APP_PREFERRED_PAGE_COOKIE } from "$lib/components/postReveal/types";
import { serverApi } from "$lib/server/apiClient";
import type { Theme } from "$lib/utils/themes";

const afterNollning = new Date("2025-10-06");
export const load = async (event) => {
  const { locals, cookies } = event;

  // Replaces the old hardcoded REVEAL_LAUNCH_DATE - see backend's Phase 2
  // nollning redesign.
  const currentRes = await serverApi(event).GET("/nollning/current", {});
  const current = currentRes.data;
  const revealTheme = current?.phase === "post_reveal";
  // Replaces getNollaGroupedNotifications' hardcoded 2025-06-26 cutoff with
  // Go's GET /notifications?nollning=true, which filters on the current
  // season's real nollaStartAt instead - see backend/CLAUDE.md's
  // "Notifications routes" section and DESIGN.md's Phase 9 entry.
  const notificationsPromise = serverApi(event)
    .GET("/notifications", { params: { query: { nollning: true } } })
    .then((res) => res.data?.notifications ?? []);
  // The member's nolla group in the current season, if any - Go's
  // phadder-role lookup does the season check.
  const phadderGroup = locals.user?.studentId
    ? serverApi(event)
        .GET("/members/{studentId}/phadder-role", {
          params: { path: { studentId: locals.user.studentId } },
        })
        .then(async (res) => {
          const groupId = res.data?.role === "nolla" ? res.data.groupId : null;
          if (!groupId) return null;
          const group = await serverApi(event).GET(
            "/nollning/phadder-groups/{id}",
            {
              params: { path: { id: groupId } },
            },
          );
          return group.data ? { name: group.data.name } : null;
        })
    : null;

  if (locals.isApp)
    cookies.set(APP_PREFERRED_PAGE_COOKIE, "nollning", {
      path: "/",
      expires: afterNollning,
    });

  return {
    revealTheme,
    notificationsPromise,
    phadderGroup,
    theme: (revealTheme ? "nollningPostReveal" : "light") as Theme,
  };
};

export type PostRevealLayoutData = Awaited<ReturnType<typeof load>>;
