import { compareBoardPositions } from "$lib/utils/committee-ordering/sort";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const boardPositions = await prisma.committee.findMany({
    where: {
      positions: {
        some: {
          active: true,
          boardMember: true,
        },
      },
    },
    include: {
      positions: {
        where: {
          active: true,
          boardMember: true,
          NOT: undefined,
        },
        include: {
          mandates: {
            where: {
              startDate: {
                lte: new Date(),
              },
              endDate: {
                gte: new Date(),
              },
              NOT: undefined,
            },
            select: {
              memberId: true,
            },
          },
        },
      },
    },
  });
  const boardMembers = await prisma.member.findMany({
    where: {
      id: {
        in: boardPositions.flatMap((c) =>
          c.positions.flatMap((p) => p.mandates.flatMap((m) => m.memberId)),
        ),
      },
    },
    include: {
      mandates: {
        where: {
          startDate: {
            lte: new Date(),
          },
          endDate: {
            gte: new Date(),
          },
          NOT: undefined,
          AND: {
            position: {
              active: true,
              boardMember: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  // merge the board members into the board positions
  const mergedBoardPositions = [];
  for (const boardPos of boardPositions.flatMap((c) => c.positions)) {
    const boardMember = boardMembers.find((m) =>
      m.mandates.some((mandate) => mandate.positionId === boardPos.id),
    );
    if (!boardMember) {
      // still add the board position, but with no member, render as vacant
      mergedBoardPositions.push({
        studentId: null,
        position: boardPos,
        firstName: null,
        nickname: null,
        lastName: null,
        picturePath: null,
        classProgramme: null,
        classYear: null,
      });
    } else {
      // not vacant, no problem
      mergedBoardPositions.push({
        position: boardPos,
        ...boardMember,
      });
    }
  }

  mergedBoardPositions.sort((a, b) =>
    compareBoardPositions(a.position.id, b.position.id),
  );
  return {
    boardPositions: mergedBoardPositions,
  };
};
