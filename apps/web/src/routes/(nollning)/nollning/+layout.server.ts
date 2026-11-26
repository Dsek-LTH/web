import { APP_PREFERRED_PAGE_COOKIE } from "$lib/components/postReveal/types";
import { serverApi } from "$lib/server/apiClient";
import type { Theme } from "$lib/utils/themes";

export const load = async (event) => {
  const { locals, cookies } = event;
  const api = serverApi(event);
  const studentId = locals.user?.studentId;

  // Awaited together rather than returned as promises: an unawaited promise
  // in layout data streams every page under it, and a streamed page is sent
  // with status 200 even when it renders an error.
  const [current, notifications, phadderGroup] = await Promise.all([
    // Replaces the old hardcoded REVEAL_LAUNCH_DATE - see backend's Phase 2
    // nollning redesign.
    api.GET("/nollning/current", {}).then((res) => res.data),
    // Replaces getNollaGroupedNotifications' hardcoded 2025-06-26 cutoff with
    // Go's GET /notifications?nollning=true, which filters on the current
    // season's real nollaStartAt instead.
    api
      .GET("/notifications", { params: { query: { nollning: true } } })
      .then((res) => res.data?.notifications ?? []),
    // The member's nolla group in the current season, if any - Go's
    // phadder-role lookup does the season check.
    studentId
      ? api
          .GET("/members/{studentId}/phadder-role", {
            params: { path: { studentId } },
          })
          .then(async (res) => {
            const groupId =
              res.data?.role === "nolla" ? res.data.groupId : null;
            if (!groupId) return null;
            const group = await api.GET("/nollning/phadder-groups/{id}", {
              params: { path: { id: groupId } },
            });
            return group.data ? { name: group.data.name } : null;
          })
      : null,
  ]);
  const revealTheme = current?.phase === "post_reveal";

  // The native app opens the nollning site until the season ends. Outside a
  // season there is nothing to prefer it for.
  if (locals.isApp && current?.season)
    cookies.set(APP_PREFERRED_PAGE_COOKIE, "nollning", {
      path: "/",
      expires: new Date(current.season.endAt),
    });

  return {
    revealTheme,
    notifications,
    phadderGroup,
    theme: (revealTheme ? "nollningPostReveal" : "light") as Theme,
  };
};

export type PostRevealLayoutData = Awaited<ReturnType<typeof load>>;
