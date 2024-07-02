import type { RequestHandler } from "./$types";

import { error } from "@sveltejs/kit";
import { uploadNotificationToken } from "./uploadNotificationToken";

export const POST: RequestHandler = async ({ locals, request }) => {
  const { prisma, user } = locals;
  const body = await request.json();
  if (!("notificationToken" in body)) {
    throw error(400, "Invalid body, missing notification token");
  }
  const token = body.notificationToken;
  await uploadNotificationToken(prisma, user, token);
  return new Response("Token saved");
};
