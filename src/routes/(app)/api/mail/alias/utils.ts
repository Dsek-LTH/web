import type { EmailAlias, Member, PrismaClient } from "@prisma/client";

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

export async function getEmailsForManyMembers(
  memberIds: string[],
  prisma: PrismaClient,
) {
  return (
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
        email: true,
      },
    })
  ).reduce<Map<string, string>>((acc, cur) => {
    if (cur.studentId != null && cur.email != null) {
      acc.set(cur.studentId, cur.email);
    }
    return acc;
  }, new Map<string, string>());
}
