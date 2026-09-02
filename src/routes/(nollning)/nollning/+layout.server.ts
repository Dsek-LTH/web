import { APP_PREFERRED_PAGE_COOKIE } from "$lib/components/postReveal/types";
import { getNollaGroupedNotifications } from "$lib/utils/notifications/nollaNotifications";
import { api } from "$lib/api/client";
import type { Theme } from "$lib/utils/themes";
import { notificationSchema } from "$lib/zod/schemas";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";

const afterNollning = new Date("2025-10-06");
export const load = async ({ locals, cookies, fetch }) => {
  const { prisma, user, member } = locals;

  // Replaces the old hardcoded REVEAL_LAUNCH_DATE - see backend's Phase 2
  // nollning redesign.
  const currentRes = await api.GET("/nollning/current", { fetch });
  const current = currentRes.data;
  const revealTheme = current?.phase === "post_reveal";
  const notificationsPromise = getNollaGroupedNotifications(user, prisma);
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
    mutateNotificationForm: await superValidate(zod4(notificationSchema)),
    phadderGroup,
    theme: (revealTheme ? "nollningPostReveal" : "light") as Theme,
  };
};

export type PostRevealLayoutData = Awaited<ReturnType<typeof load>>;
