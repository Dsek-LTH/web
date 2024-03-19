import type { Actions } from "./$types";
import { notificationSchema } from "$lib/zod/schemas";
import { message, superValidate } from "sveltekit-superforms/server";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";

export const actions: Actions = {
  // Mark all unread notifications as read
  readNotification: async ({ locals, request }) => {
    const { user, prisma } = locals;
    authorize(apiNames.LOGGED_IN, user);
    const form = await superValidate(request, notificationSchema);
    if (!form.valid) return fail(400, { form });
    await prisma.notification.updateMany({
      where: {
        memberId: user?.memberId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return message(form, {
      message: "Notiser lästa",
      type: "hidden",
    });
  },
  // Delete single or multiple notifications on database
  deleteNotification: async ({ locals, request }) => {
    const { user, prisma } = locals;
    authorize(apiNames.LOGGED_IN, user);
    const form = await superValidate(request, notificationSchema);
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
        message: "Notiser borttagna",
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
        message: "Notis borttagen",
        type: "hidden",
      });
    }
    return message(
      form,
      { message: "Kunde inte ta bort notis", type: "error" },
      { status: 500 },
    );
  },
};
