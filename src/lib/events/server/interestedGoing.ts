import { eventLink } from "$lib/events/events";
import { interestedGoingSchema } from "$lib/events/schema";
import { getFullName } from "$lib/utils/client/member";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import { fail, type Action } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";
import * as messages from "$paraglide/messages";

export const interestedAction =
  (isInterested: boolean, isGoing: boolean): Action =>
  async ({ request, locals }) => {
    const { prisma, user, member } = locals;
    const form = await superValidate(request, zod4(interestedGoingSchema));
    if (!form.valid) return fail(400, { form });

    const event = await prisma.event.update({
      where: { id: form.data.eventId },
      data: {
        interested: {
          [isInterested ? "connect" : "disconnect"]: {
            studentId: user?.studentId,
          },
        },
        going: {
          [isGoing ? "connect" : "disconnect"]: {
            studentId: user?.studentId,
          },
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        author: {
          select: {
            id: true,
          },
        },
      },
    });

    if (member) {
      if (isGoing) {
        await sendNotification({
          title: `${event.title}`,
          message: messages.events_is_interested_in_your_event({
            name: getFullName(member),
          }),
          type: NotificationType.EVENT_GOING,
          link: eventLink(event),
          memberIds: [event.author.id],
          fromMemberId: member.id,
        });
      } else if (isInterested) {
        await sendNotification({
          title: `${event.title}`,
          message: messages.events_is_interested_in_your_event({
            name: getFullName(member),
          }),
          type: NotificationType.EVENT_INTERESTED,
          link: eventLink(event),
          memberIds: [event.author.id],
          fromMemberId: member.id,
        });
      }
    }
    return message(form, {
      message: `${
        isInterested
          ? messages.events_is_interested_in()
          : isGoing
            ? messages.events_is_coming_to()
            : messages.events_is_not_coming_to_nor_interested_in()
      } event`,
      type: "hidden",
    });
  };
