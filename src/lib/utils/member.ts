import type { PrismaClient } from "@prisma/client";
import { getDerivedRoles } from "./authorization";

export const getCustomAuthorOptions = async (
  prisma: PrismaClient,
  memberId: string,
) => {
  const activePositionIds = await prisma.position
    .findMany({
      select: {
        id: true,
      },
      where: {
        mandates: {
          some: {
            startDate: {
              lte: new Date(),
            },
            endDate: {
              gte: new Date(),
            },
            memberId,
          },
        },
      },
    })
    .then((positions) => positions.map((pos) => pos.id));
  return await prisma.customAuthor.findMany({
    where: {
      roles: {
        some: {
          role: {
            in: getDerivedRoles(activePositionIds, !!memberId),
          },
        },
      },
    },
  });
};
