import { env } from "$env/dynamic/public";
import { getMyGroupedNotifications } from "$lib/utils/notifications/myNotifications";
import { emptySchema, notificationSchema } from "$lib/zod/schemas";
import { loadFlash } from "sveltekit-flash-message/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { api } from "$lib/api/client";

// alerts is fetched fresh from Go on every load (no module-level cache) -
// the old alertsCache here was shared, mutable process-wide state with no
// TTL of its own beyond the next `depends("alerts")` invalidation; a real
// per-request read is simple enough now that this isn't a Prisma
// round-trip DESIGN.md's mocking principle would have any reason to avoid.
export const load = loadFlash(async ({ locals, depends, fetch }) => {
  depends("/api/notifications/my");
  depends("alerts");

  const { user, prisma } = locals;
  const notificationsPromise = user?.memberId
    ? getMyGroupedNotifications(user, prisma)
    : undefined;

  const alertsRes = await api.GET("/alerts", { fetch });

  return {
    alerts: alertsRes.data ?? [],
    notificationsPromise,
    mutateNotificationForm: await superValidate(zod4(notificationSchema)),
    readNotificationForm: await superValidate(zod4(emptySchema)),
  };
});

export type GlobalAppLoadData = Awaited<ReturnType<typeof load>>;

export const ssr = env.PUBLIC_DISABLE_SSR_GLOBALLY === "true" ? false : true;
