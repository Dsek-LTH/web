import { BASIC_ARTICLE_FILTER } from "$lib/news/articles";
import { getCustomAuthorOptions } from "$lib/utils/member";

import type {
  Author,
  CustomAuthor,
  Mandate,
  Member,
  Position,
  Prisma,
  PrismaClient,
} from "@prisma/client";

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
      customAuthor: true,
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
  prisma: PrismaClient,
  filters: ArticleFilters = { page: 0, pageSize: 10 },
): Promise<[Article[], number]> => {
  const pageNumber = filters.page ?? 0;
  const pageSize = filters.pageSize ?? 10;

  const baseFilter = BASIC_ARTICLE_FILTER();
  const where: Prisma.ArticleWhereInput = {
    // search:
    ...baseFilter,
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
            ...baseFilter.tags,
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
                ...(baseFilter.tags?.some ? [baseFilter.tags.some] : []),
              ],
            },
          },
        }
      : {}),
  };
  // Don't run as transaction, a little read only data race is fine
  const [articles, count] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: {
        publishedAt: "desc",
      },
      skip: Math.max(pageNumber - 1, 0) * pageSize,
      take: pageSize,
      include,
    }),
    prisma.article.count({ where }),
  ]);
  return [articles, Math.ceil(count / pageSize)];
};

export const getArticle = async (prisma: PrismaClient, slug: string) => {
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

export type AuthorOption = Author & {
  member: Member;
  mandate:
    | (Mandate & {
        position: Position;
      })
    | null;
  customAuthor: CustomAuthor | null;
};

export const getArticleAuthorOptions = async (
  prisma: PrismaClient,
  memberWithMandates: Prisma.MemberGetPayload<{
    include: {
      mandates: {
        include: {
          position: true;
        };
      };
    };
  }>,
) => {
  const memberId = memberWithMandates.id;
  const customAuthorOptions = await getCustomAuthorOptions(prisma, memberId);
  const authorOptions: AuthorOption[] = [
    {
      id: "0",
      memberId: memberWithMandates.id,
      member: memberWithMandates,
      mandate: null,
      mandateId: null,
      customAuthor: null,
      customId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "Member",
    },
    ...(memberWithMandates?.mandates.map((mandate) => {
      return {
        id: String(mandate.id), // unique
        memberId: memberWithMandates.id,
        member: memberWithMandates,
        mandateId: mandate.id,
        mandate: mandate,
        customAuthor: null,
        customId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "Mandate",
      };
    }) ?? []),
    ...(customAuthorOptions?.map((customAuthor) => {
      return {
        id: String(customAuthor.id), // unique
        memberId: memberWithMandates.id,
        member: memberWithMandates,
        mandate: null,
        mandateId: null,
        customAuthor: customAuthor,
        customId: customAuthor.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "Custom",
      };
    }) ?? []),
  ];
  return authorOptions;
};
