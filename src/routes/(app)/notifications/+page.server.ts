import { notificationSchema } from "$lib/zod/schemas";
import { error, fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import type { Actions } from "./$types";
import * as m from "$paraglide/messages";

export const load = async ({ request }) => {
  throw redirect(302, request.headers.get("referer") || "/");
};

export const actions: Actions = {
  // Mark all unread notifications as read
  readNotifications: async ({ locals, request }) => {
    const { user, prisma } = locals;
    if (!user.memberId) {
      error(403, m.notifications_errors_notLoggedIn());
    }
    const form = await superValidate(request, zod(notificationSchema));
    if (!form.valid) return fail(400, { form });
    const idFilter =
      form.data.notificationId ??
      (form.data.notificationIds !== null
        ? {
            in: form.data.notificationIds!,
          }
        : undefined);
    await prisma.notification.updateMany({
      where: {
        memberId: user?.memberId,
        readAt: null,
        id: idFilter,
      },
      data: {
        readAt: new Date(),
      },
    });

    return message(form, {
      message: m.notifications_notificationsRead(),
      type: "hidden",
    });
  },
  // Delete single or multiple notifications on database
  deleteNotification: async ({ locals, request }) => {
    const { user, prisma } = locals;
    if (!user.memberId) {
      error(403, m.notifications_errors_notLoggedIn());
    }
    const form = await superValidate(request, zod(notificationSchema));
    if (!form.valid) return fail(400, { form });
    // If multiple ids and not a single id have been provided, delete many, otherwise,
    // if a single has been provided, delete single, else return
    if (form.data.notificationIds && form.data.notificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          memberId: user!.memberId,
          id: {
            in: form.data.notificationIds,
          },
        },
      });
      return message(form, {
        message: m.notifications_notificationsRemoved(),
        type: "hidden",
      });
    } else if (form.data.notificationId) {
      await prisma.notification.delete({
        where: {
          memberId: user!.memberId,
          id: form.data.notificationId,
        },
      });
      return message(form, {
        message: m.notifications_notificationRemoved(),
        type: "success",
      });
    }
    return message(form, {
      message: m.notifications_errors_couldNotRemove(),
      type: "error",
    });
  },
};
