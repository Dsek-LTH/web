import type { RequestHandler } from "./$types";

import { error } from "@sveltejs/kit";
import { serverApi } from "$lib/server/apiClient";

// Thin proxy to Go's POST /notifications/token (see backend/internal/api/
// huma_notifications.go) - the native wrapper app calls this same-origin
// route via a plain fetch (see AppNotificationTokenHandler.svelte), so it
// stays a real endpoint rather than being inlined into that component.
// uploadNotificationToken.ts's Prisma-based upsert (with its own in-memory
// dedup cache) is gone - Go's UpsertExpoToken is already a cheap idempotent
// upsert, so that cache bought nothing worth replicating.
export const POST: RequestHandler = async (event) => {
  const { request } = event;
  const body = await request.json();
  if (!("notificationToken" in body)) {
    error(400, "Invalid body, missing notification token");
  }
  const res = await serverApi(event).POST("/notifications/token", {
    body: { token: body.notificationToken },
  });
  if (res.error) {
    error(500, "Couldn't save token");
  }
  return new Response("Token saved");
};
