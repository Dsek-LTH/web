import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { notificationSchema } from "$lib/zod/schemas";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions } from "./$types";

export const actions: Actions = {
  // Mark all unread notifications as read
  readNotifications: async (event) => {
    const { locals, request } = event;
    const { user, prisma } = locals;
    authorize(apiNames.LOGGED_IN, user);
    const form = await superValidate(request, notificationSchema);
    if (!form.valid) return fail(400, { form });
    const idFilter =
      form.data.notificationId ??
      (form.data.notificationIds !== null
        ? {
            in: form.data.notificationIds!,
          }
        : undefined);
    console.log("reading", idFilter);
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

    throw redirect(
      request.headers.get("referer") || "/",
      {
        message: "Notiser lästa",
        type: "hidden",
      },
      event,
    );
  },
  // Delete single or multiple notifications on database
  deleteNotification: async (event) => {
    const { locals, request } = event;
    const { user, prisma } = locals;
    authorize(apiNames.LOGGED_IN, user);
    const form = await superValidate(request, notificationSchema);
    if (!form.valid) return fail(400, { form });
    const redirectUrl = request.headers.get("referer") || "/";
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
      throw redirect(
        redirectUrl,
        {
          message: "Notiser borttagna",
          type: "hidden",
        },
        event,
      );
    } else if (form.data.notificationId) {
      await prisma.notification.delete({
        where: {
          memberId: user!.memberId,
          id: form.data.notificationId,
        },
      });
      throw redirect(
        redirectUrl,
        {
          message: "Notis borttagen",
          type: "hidden",
        },
        event,
      );
    }
    throw redirect(
      redirectUrl,
      {
        message: "Kunde inte ta bort notis",
        type: "error",
      },
      event,
    );
  },
};
