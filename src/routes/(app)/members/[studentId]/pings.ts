import { getFullName } from "$lib/utils/client/member";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import type { Ping, PrismaClient } from "@prisma/client";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
type MemberIdentification =
  | {
      memberId: string;
      studentId?: undefined;
    }
  | {
      memberId?: undefined;
      studentId: string;
    };
type SendPingProps = {
  link: string; // link to the page where the ping is sent from
  fromMemberId: MemberIdentification; // the member that sends the ping
  toMemberId: MemberIdentification; // the member that should recieve the ping
};

export const sendPing = async (
  prisma: PrismaClient,
  { link, fromMemberId, toMemberId }: SendPingProps,
) => {
  const sendingMember = await assertMemberExists(
    prisma,
    fromMemberId,
    m.members_errors_senderNotFound(),
  );
  const receivingMember = await assertMemberExists(
    prisma,
    toMemberId,
    m.members_errors_receiverNotFound(),
  );

  try {
    const previousPing = await findPreviousPing(
      prisma,
      sendingMember.id,
      receivingMember.id,
    );
    if (previousPing === null) {
      await performInitialPing(prisma, sendingMember.id, receivingMember.id);
    } else {
      await performSubsequentPing(
        prisma,
        sendingMember.id,
        receivingMember.id,
        previousPing,
      );
    }
  } catch (e) {
    throw error(
      500,
      m.members_errors_couldntPing({
        e: e instanceof Error ? e.message : "???",
      }),
    );
  }

  await sendNotification({
    title: "PING!",
    message: `${getFullName(sendingMember)} har pingat dig!`,
    type: NotificationType.PING,
    link: link,
    memberIds: [receivingMember.id],
    fromMemberId: sendingMember.id,
  });
};

const assertMemberExists = async (
  prisma: PrismaClient,
  member: MemberIdentification,
  errorMsg = m.members_errors_memberDoesntExist(),
) => {
  try {
    const foundMember = await prisma.member.findFirst({
      where: member.memberId
        ? { id: { equals: member.memberId } }
        : {
            studentId: member.studentId,
          },
      select: {
        id: true,
        firstName: true,
        nickname: true,
        lastName: true,
      },
    });
    if (foundMember == null || !foundMember) throw error(400, errorMsg);
    return foundMember;
  } catch (e) {
    console.error(e);
    throw error(
      500,
      m.members_errors_failedToFindMember({
        e: e instanceof Error ? e.message : "???",
      }),
    );
  }
};

const findPreviousPing = (
  prisma: PrismaClient,
  fromMemberId: string,
  toMemberId: string,
) =>
  prisma.ping.findFirst({
    where: {
      OR: [
        {
          fromMemberId: fromMemberId,
          toMemberId: toMemberId,
        },
        {
          fromMemberId: toMemberId,
          toMemberId: fromMemberId,
        },
      ],
    },
    select: {
      fromMemberId: true,
    },
  });

const performInitialPing = (
  prisma: PrismaClient,
  fromMemberId: string,
  toMemberId: string,
) =>
  prisma.ping.create({
    data: {
      fromMemberId: fromMemberId,
      toMemberId: toMemberId,
      fromSentAt: new Date(),
      createdAt: new Date(),
      count: 1,
    },
  });

const performSubsequentPing = (
  prisma: PrismaClient,
  fromMemberId: string,
  toMemberId: string,
  previousPing: Pick<Ping, "fromMemberId">,
) => {
  const isSenderFromColumn = previousPing.fromMemberId === fromMemberId;
  return prisma.ping.update({
    where: {
      fromMemberId_toMemberId: {
        fromMemberId: fromMemberId,
        toMemberId: toMemberId,
      },
    },
    data: {
      fromSentAt: isSenderFromColumn ? new Date() : undefined,
      toSentAt: isSenderFromColumn ? undefined : new Date(),
      count: { increment: 1 },
    },
  });
};
