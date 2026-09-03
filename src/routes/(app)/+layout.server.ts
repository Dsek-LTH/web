import { env } from "$env/dynamic/public";
import { loadFlash } from "sveltekit-flash-message/server";
import { serverApi } from "$lib/server/apiClient";

// alerts is fetched fresh from Go on every load (no module-level cache) -
// the old alertsCache here was shared, mutable process-wide state with no
// TTL of its own beyond the next `depends("alerts")` invalidation; a real
// per-request read is simple enough now that this isn't a Prisma
// round-trip DESIGN.md's mocking principle would have any reason to avoid.
//
// notificationsPromise now comes from Go's GET /notifications (backend/
// internal/api/huma_notifications.go) instead of
// getMyGroupedNotifications(user, prisma) - see backend/CLAUDE.md's
// "Notifications routes" section. mutateNotificationForm/
// readNotificationForm (superValidate scaffolding for the classic
// notifications/+page.server.ts actions) are gone - grep confirmed zero
// .svelte consumers; NotificationBell/List/Item all use
// notifications/data.remote.ts's remote functions instead.
export const load = loadFlash(async (event) => {
  const { locals, depends } = event;
  depends("/api/notifications/my");
  depends("alerts");

  const { user } = locals;
  // serverApi (not $lib/api/client's plain `api`) so both /alerts'
  // closedByMe and /notifications' acting-identity scoping are correct
  // during SSR too, not just after client-side hydration re-fetches with
  // real cookies.
  const api = serverApi(event);
  const notificationsPromise = user?.memberId
    ? api.GET("/notifications", {}).then((res) => res.data ?? [])
    : undefined;

  const alertsRes = await api.GET("/alerts", {});

  return {
    alerts: alertsRes.data ?? [],
    notificationsPromise,
  };
});

export type GlobalAppLoadData = Awaited<ReturnType<typeof load>>;

export const ssr = env.PUBLIC_DISABLE_SSR_GLOBALLY === "true" ? false : true;
