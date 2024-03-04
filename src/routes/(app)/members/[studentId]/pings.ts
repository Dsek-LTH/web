import { getFullName } from "$lib/utils/client/member";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import type { PrismaClient } from "@prisma/client";
import { error } from "@sveltejs/kit";

type SendPingProps = {
  link: string;
  toMemberId: string;
  fromMemberId: string;
  fromSent: boolean;
};

export const sendPing = async (
  prisma: PrismaClient,
  { link, fromMemberId, toMemberId, fromSent }: SendPingProps,
) => {
  const sendingMember = await prisma.member.findFirst({
    where: {
      id: {
        equals: fromSent ? fromMemberId : toMemberId,
      },
    },
    select: {
      firstName: true,
      nickname: true,
      lastName: true,
    },
  });
  if (sendingMember == null || !sendingMember)
    throw error(500, "Couldn't find sending member");
  const receivingMember = await prisma.member.findFirst({
    where: {
      id: {
        equals: fromSent ? toMemberId : fromMemberId,
      },
    },
    select: {
      id: true,
      firstName: true,
      subscriptionSettings: {
        select: {
          pushNotification: true,
        },
      },
    },
  });
  if (receivingMember == null || !receivingMember)
    throw error(500, "Couldn't find recieving member");

  const [databaseResult] = await Promise.allSettled([
    await prisma.ping.upsert({
      where: {
        fromMemberId_toMemberId: {
          fromMemberId: fromMemberId,
          toMemberId: toMemberId,
        },
      },
      create: {
        fromMemberId: fromMemberId,
        toMemberId: toMemberId,
        fromSentAt: new Date(),
        createdAt: new Date(),
        count: 1,
      },
      update: {
        fromSentAt: fromSent ? new Date() : undefined,
        toSentAt: fromSent ? undefined : new Date(),
        count: { increment: 1 },
      },
    }),
  ]);
  if (databaseResult.status === "rejected") {
    throw error(500, `Failed to ping. Error: ${databaseResult.reason}`);
  }

  await sendNotification(prisma, {
    title: "PING!",
    message: `Du har blivit pingad av ${getFullName(sendingMember)}!`,
    type: NotificationType.PING,
    link: link,
    memberIds: [receivingMember.id],
    fromMemberId: fromSent ? fromMemberId : toMemberId,
  });
};
