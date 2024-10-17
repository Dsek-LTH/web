import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import type { RequestEvent } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions: Actions = {
  accept: async (event: RequestEvent) => {
    await performAction(event, true)
  },
  reject: async (event: RequestEvent) => {
    await performAction(event, false)
  },
};

async function performAction(event: RequestEvent, accepted: boolean) {
  const { request, locals } = event;
  const { prisma, user } = locals;
  const formData = await request.formData();
  const id = formData.get("id");
  const status = accepted ? "ACCEPTED" : "DENIED"

  if (id && typeof id === "string") {
    await prisma.bookingRequest.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    const request = await prisma.bookingRequest.findFirst({
      where: {
        id,
      },
      select: {
        bookerId: true,
        event: true,
      },
    });

    if (request && request.bookerId != null && user && user.memberId) {
      sendNotification({
        title: `Booking request ${status.toLowerCase()}`,
        message: `Your booking request for ${request.event} has been ${status.toLowerCase()}`,
        type: NotificationType.BOOKING_REQUEST,
        link: `/booking`,
        memberIds: [request.bookerId],
        fromMemberId: user.memberId,
      });
    }
  }
}
