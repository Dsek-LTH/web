import { error, fail, type RequestEvent, type ServerLoadEvent } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";

// Both settingsLoad and settingsActions now call Go's
// GET/PUT /notification-settings and GET /tags (backend/internal/api/
// huma_notifications.go) instead of prisma.subscriptionSetting/
// prisma.member.subscribedTags directly - see backend/CLAUDE.md's
// "Notifications routes" section. subscribedTags's old shape
// ({ subscribedTags: Tag[] }) is gone - the Go settings response only
// carries subscribedTagIds, so +page.svelte checks tag.id membership
// against that list instead of matching by name.
export const settingsLoad = async (event: ServerLoadEvent) => {
  const { locals } = event;
  if (!locals.user.memberId) {
    error(401, "Du måste logga in för att ändra inställningar");
  }

  const api = serverApi(event);
  const [settingsRes, tagsRes] = await Promise.all([
    api.GET("/notification-settings", {}),
    api.GET("/tags", {}),
  ]);
  if (settingsRes.error) error(500, "Failed to load notification settings");

  return {
    tags: tagsRes.data ?? [],
    subscribedTagIds: settingsRes.data.subscribedTagIds ?? [],
    subscriptions: settingsRes.data.subscriptions ?? [],
    pushSubscriptions: settingsRes.data.pushSubscriptions ?? [],
  };
};

export type SettingsPageData = Awaited<ReturnType<typeof settingsLoad>>;

export const settingsActions = {
  default: async (event: RequestEvent) => {
    const { locals, request } = event;
    const form = await request.formData();
    if (!locals.user) return fail(401, { form });
    const subscription = form.getAll("subscription").map(String);
    const push = form.getAll("push").map(String);
    const tags = form.getAll("tag").map(String);

    const res = await serverApi(event).PUT("/notification-settings", {
      body: {
        subscriptions: subscription,
        pushSubscriptions: push,
        subscribedTagIds: tags,
      },
    });
    if (res.error) {
      return fail(400, { form });
    }
  },
};
