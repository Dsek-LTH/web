import { error, type RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/utils/prisma";

export const GET: RequestHandler = async ({ url }) => {
  const search = url.searchParams.get("search")?.toLowerCase();

  if (search == undefined || search.length === 0) {
    throw error(400, "you need to provide a search value");
  }

  let [firstName, lastName]: [string | undefined, string | undefined] = [
    undefined,
    undefined,
  ];
  if (search.split(" ").length >= 2) {
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
                  contains: firstName ?? search,
                  mode: "insensitive",
                }
              : undefined,
        },
        {
          lastName:
            lastName || (!studentId && !nickname)
              ? {
                  contains: lastName ?? search,
                  mode: "insensitive",
                }
              : undefined,
        },
        {
          nickname: nickname
            ? {
                contains: nickname,
                mode: "insensitive",
              }
            : undefined,
        },
      ],
      studentId: studentId,
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
  return new Response(JSON.stringify(members));
};
