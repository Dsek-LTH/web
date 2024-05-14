import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, url }) => {
  const { prisma } = locals;
  const search = url.searchParams.get("search")?.toLowerCase();

  if (search == undefined || search.length === 0) {
    throw error(400, "you need to provide a search value");
  }

  const split = search.split(/ +/);
  const firstName = split[0];
  const lastName = split[1];
  const nickname = search.includes('"') ? search : undefined;
  const studentId = /\w{2}\d{1}/.test(search) ? search : undefined;

  const members = await prisma.member.findMany({
    where: {
      OR: [
        lastName
          ? {
              AND: {
                firstName: {
                  contains: firstName,
                  mode: "insensitive",
                },
                lastName: {
                  contains: lastName,
                  mode: "insensitive",
                },
              },
            }
          : {
              OR: [
                {
                  firstName: {
                    contains: firstName,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
        {
          nickname: {
            contains: nickname,
            mode: "insensitive",
          },
        },
        {
          studentId: {
            contains: studentId,
            mode: "insensitive",
          },
        },
      ],
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
