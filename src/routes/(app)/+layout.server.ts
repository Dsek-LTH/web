import { env } from "$env/dynamic/public";
import { getMyGroupedNotifications } from "$lib/utils/notifications/myNotifications";
import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import { loadFlash } from "sveltekit-flash-message/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { serverApi } from "$lib/server/apiClient";

// alerts is fetched fresh from Go on every load (no module-level cache) -
// the old alertsCache here was shared, mutable process-wide state with no
// TTL of its own beyond the next `depends("alerts")` invalidation; a real
// per-request read is simple enough now that this isn't a Prisma
// round-trip DESIGN.md's mocking principle would have any reason to avoid.
export const load = loadFlash(async (event) => {
  const { locals, depends } = event;
  depends("/api/notifications/my");
  depends("alerts");

  const { user, prisma } = locals;
  const notificationsPromise = user?.memberId
    ? getMyGroupedNotifications(user, prisma)
    : undefined;

  // serverApi (not $lib/api/client's plain `api`) so /alerts' closedByMe -
  // resolved from the acting identity - is correct during SSR too, not
  // just after client-side hydration re-fetches with real cookies.
  const alertsRes = await serverApi(event).GET("/alerts", {});

  return {
    alerts: alertsRes.data ?? [],
    notificationsPromise,
    mutateNotificationForm: await superValidate(zod4(notificationSchema)),
    readNotificationForm: await superValidate(zod4(emptySchema)),
  };
});

export type GlobalAppLoadData = Awaited<ReturnType<typeof load>>;

export const ssr = env.PUBLIC_DISABLE_SSR_GLOBALLY === "true" ? false : true;
