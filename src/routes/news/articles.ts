import prisma from "$lib/prisma";
import type { Member, Prisma } from "@prisma/client";

type ArticleFilters = {
  tags?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
};

const include = {
  author: {
    include: {
      member: true,
      mandate: {
        include: {
          position: true,
        },
      },
    },
  },
  comments: {
    include: {
      member: true,
    },
  },
  likers: true,
  tags: true,
};

export const getAllArticles = async (
  filters: ArticleFilters = { page: 0, pageSize: 10 }
): Promise<[Article[], number]> => {
  filters.page = filters.page ?? 0;
  filters.pageSize = filters.pageSize ?? 10;

  const where: Prisma.ArticleWhereInput = {
    publishedAt: {
      lte: new Date(),
      not: null,
    },
    OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
    // search:
    ...(filters.search && filters.search.length > 0
      ? {
          OR: [
            {
              header: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              headerEn: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              body: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              bodyEn: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    // tags
    ...(filters.tags && filters.tags.length > 0
      ? {
          tags: {
            some: {
              OR: [
                {
                  name: {
                    in: filters.tags,
                    mode: "insensitive",
                  },
                },
                {
                  nameEn: {
                    in: filters.tags,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        }
      : {}),
  };
  const [articles, count] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      orderBy: {
        publishedAt: "desc",
      },
      skip: filters.page * filters.pageSize,
      take: filters.pageSize,
      include,
    }),
    prisma.article.count({ where }),
  ]);
  return [articles, Math.ceil(count / filters.pageSize)];
};

export const getArticle = async (slug: string) => {
  const response = await prisma.article.findUnique({
    where: {
      slug,
      publishedAt: {
        lte: new Date(),
        not: null,
      },
      OR: [{ removedAt: { gt: new Date() } }, { removedAt: null }],
    },
    include,
  });
  return response;
};

export type Article = NonNullable<Awaited<ReturnType<typeof getArticle>>>;

export type AuthorOption = {
  id: string;
  memberId: string;
  member: Member;
  mandateId: string | null;
  mandate: Prisma.MandateGetPayload<{
    include: {
      position: true;
    };
  }> | null;
  customId: string | null;
  createdAt: Date;
  updatedAt: Date;
  type: string;
};

export const getArticleAuthorOptions = (
  memberWithMandates: Prisma.MemberGetPayload<{
    include: {
      mandates: {
        include: {
          position: true;
        };
      };
    };
  }>
) => {
  const authorOptions: AuthorOption[] = [
    {
      id: "0",
      memberId: memberWithMandates.id,
      member: memberWithMandates,
      mandateId: null,
      mandate: null,
      customId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "Member",
    },
    ...(memberWithMandates?.mandates.map((mandate) => {
      return {
        id: String(mandate.id),
        memberId: memberWithMandates.id,
        member: memberWithMandates,
        mandateId: mandate.id,
        mandate: mandate,
        customId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "Mandate",
      };
    }) ?? []),
  ];
  return authorOptions;
};
