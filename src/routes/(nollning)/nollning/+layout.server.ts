import { APP_PREFERRED_PAGE_COOKIE } from "$lib/components/postReveal/types";
import { serverApi } from "$lib/server/apiClient";
import type { Theme } from "$lib/utils/themes";

const afterNollning = new Date("2025-10-06");
export const load = async (event) => {
  const { locals, cookies } = event;
  const { prisma, member } = locals;

  // Replaces the old hardcoded REVEAL_LAUNCH_DATE - see backend's Phase 2
  // nollning redesign.
  const currentRes = await serverApi(event).GET("/nollning/current", {});
  const current = currentRes.data;
  const revealTheme = current?.phase === "post_reveal";
  // Replaces getNollaGroupedNotifications' hardcoded 2025-06-26 cutoff with
  // Go's GET /notifications?nolla=true, which filters on the current
  // season's real nollaStartAt instead - see backend/CLAUDE.md's
  // "Notifications routes" section and DESIGN.md's Phase 9 entry.
  const notificationsPromise = serverApi(event)
    .GET("/notifications", { params: { query: { nolla: true } } })
    .then((res) => res.data ?? []);
  const phadderGroup =
    // Season year, not calendar year, is the real "is this member this
    // year's nolla cohort" check now - same fix as auth.DerivedRoles'
    // NollaYear on the Go side (see backend's Phase 2 nollning redesign).
    member?.classYear == current?.season?.year && member?.nollningGroupId != null
      ? prisma.phadderGroup.findUnique({
          where: {
            id: member!.nollningGroupId!,
          },
          select: {
            name: true,
          },
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
