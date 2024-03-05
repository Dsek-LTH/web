import type { EmailAlias, Member, PrismaClient } from "@prisma/client";
import keyKloackAdminClient from "$lib/server/keycloak";

export async function getAliasToPositions(
  prisma: PrismaClient,
): Promise<Map<string, EmailAlias[]>> {
  return (
    await prisma.emailAlias.findMany({
      include: {
        position: true,
      },
      orderBy: {
        email: "asc",
      },
    })
  ).reduce<Map<string, EmailAlias[]>>((acc, cur) => {
    if (!acc.has(cur.email)) {
      acc.set(cur.email, []);
    }
    acc.get(cur.email)?.push(cur);
    return acc;
  }, new Map<string, EmailAlias[]>());
}

export async function getCurrentMembersForPosition(
  positionId: string,
  prisma: PrismaClient,
): Promise<Array<{ studentId: Member["studentId"]; memberId: Member["id"] }>> {
  const now = new Date();
  return prisma.mandate
    .findMany({
      where: {
        positionId: positionId,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      select: {
        memberId: true,
        member: {
          select: {
            studentId: true,
          },
        },
      },
    })
    .then((mandates) =>
      mandates.reduce<
        Array<{ studentId: Member["studentId"]; memberId: Member["id"] }>
      >((acc, cur) => {
        acc.push({
          studentId: cur.member.studentId,
          memberId: cur.memberId,
        });
        return acc;
      }, []),
    );
}

// Keycloak needs studentIds to fetch emails,
// so we "convert" memberIds to studentIds
export async function getEmailsForManyMembers(
  memberIds: string[],
  prisma: PrismaClient,
) {
  const studentIds = new Set(
    (
      await prisma.member.findMany({
        where: {
          id: {
            in: memberIds,
          },
          studentId: {
            not: null,
          },
        },
        select: {
          studentId: true,
        },
      })
    ).reduce<string[]>((acc, cur) => {
      if (cur.studentId != null) {
        acc.push(cur.studentId);
      }
      return acc;
    }, []),
  );
  const usersToEmail = keyKloackAdminClient.getManyUserEmails(studentIds);
  return usersToEmail;
}
