import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import type { Prisma } from "@prisma/client";

export const searchForMembers = async (
  prisma: ExtendedPrisma,
  search: string,
  filter: Prisma.MemberWhereInput = {},
) => {
  let [firstName, lastName]: [string | undefined, string | undefined] = [
    undefined,
    undefined,
  ];
  if (
    search.split(" ").length >= 2 &&
    search.split(" ").every((part) => part.length > 0)
  ) {
    [firstName, lastName] = search.split(" ");
  }
  const nickname = search.match(/"(.+)"/)?.[1];
  const studentId = search.match(/(\w{2}\d{4}\w{2}-s)/)?.[1];

  const members = await prisma.member.findMany({
    where: {
      OR: [
        {
          firstName:
            firstName || (!studentId && !nickname)
              ? {
                  search: firstName ?? search,
                  mode: "insensitive",
                }
              : undefined,
        },
        {
          lastName:
            lastName || (!studentId && !nickname)
              ? {
                  search: lastName ?? search,
                  mode: "insensitive",
                }
              : undefined,
        },
        {
          nickname: nickname
            ? {
                search: nickname,
                mode: "insensitive",
              }
            : undefined,
        },
        {
          studentId: studentId
            ? {
                search: studentId,
                mode: "insensitive",
              }
            : undefined,
        },
      ],
      ...filter,
    },
    orderBy: [
      studentId
        ? {
            _relevance: {
              fields: ["studentId"],
              search: studentId,
              sort: "desc",
            },
          }
        : {},
      {
        _relevance: {
          fields: ["firstName"],
          search: search
            .split(" ")
            .filter((part) => part.length > 0)
            .join(" | "),
          sort: "desc",
        },
      },
      {
        _relevance: {
          fields: ["lastName"],
          search: search
            .split(" ")
            .filter((part) => part.length > 0)
            .join(" | "),
          sort: "desc",
        },
      },
      {
        classYear: "desc",
      },
    ],
    take: 20,
  });
  return members;
};
