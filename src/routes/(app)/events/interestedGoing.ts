import { getFullName } from "$lib/utils/client/member";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import { fail, type RequestEvent } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export const interestedGoingSchema = z.object({
  eventId: z.string(),
});

export type InterestedGoingSchema = typeof interestedGoingSchema;

export const interestedAction =
  (isInterested: boolean, isGoing: boolean) =>
  async ({ request, locals }: RequestEvent<Record<string, string>, string>) => {
    const { prisma, user, member } = locals;
    const form = await superValidate(request, interestedGoingSchema);
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
          message: `${getFullName(member)} kommer på ditt event.`,
          type: NotificationType.EVENT_GOING,
          link: `/events/${event.slug}`,
          memberIds: [event.author.id],
          fromMemberId: member.id,
        });
      } else if (isInterested) {
        await sendNotification({
          title: `${event.title}`,
          message: `${getFullName(member)} är intresserad av ditt event.`,
          type: NotificationType.EVENT_INTERESTED,
          link: `/events/${event.slug}`,
          memberIds: [event.author.id],
          fromMemberId: member.id,
        });
      }
    }
    return message(form, {
      message: `${
        isInterested
          ? "intresserad av"
          : isGoing
            ? "kommer på"
            : "kommer inte/är inte intresserad av"
      } event`,
      type: "hidden",
    });
  };
