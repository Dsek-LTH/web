import { getNollaGroupedNotifications } from "$lib/utils/notifications/nollaNotifications";
import { notificationSchema } from "$lib/zod/schemas.js";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

export const load = async ({ locals }) => {
  const { prisma, user } = locals;
  const notifications = await getNollaGroupedNotifications(user, prisma);
  return {
    notifications,
    mutateNotificationForm: await superValidate(zod(notificationSchema)),
  };
};
