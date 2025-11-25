import { getAllArticles } from "$lib/news/getArticles";
import { getAllTags } from "$lib/news/tags";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { likeSchema, likesAction } from "./likes";
import {
  getPageOrThrowSvelteError,
  getPageSizeOrThrowSvelteError,
} from "$lib/utils/url.server";
import { getDecryptedJWT } from "$lib/server/getDecryptedJWT";
import { env } from "$env/dynamic/private";

export const load: PageServerLoad = async ({ locals, url, request }) => {
  const { prisma } = locals;
  const articleCount = await prisma.article.count();
  const pageSize = getPageSizeOrThrowSvelteError(url);
  const page = getPageOrThrowSvelteError(url, {
    fallbackValue: 1,
    lowerBound: 1,
    upperBound: Math.ceil(articleCount / pageSize),
  });
  const [[articles, pageCount], allTags] = await Promise.all([
    getAllArticles(prisma, {
      tags: url.searchParams.getAll("tags"),
      search: url.searchParams.get("search") ?? undefined,
      page,
      pageSize,
    }),
    getAllTags(prisma),
  ]);
  const jwt = await getDecryptedJWT(request);
  const scheduledTasks: ScheduledTaskParsed[] = [];
  if (jwt) {
    const result = await fetch(
      `${env.SCHEDULER_ENDPOINT}?password=${env.SCHEDULER_PASSWORD}`,
      {
        headers: {
          Authorization: `Bearer ${jwt["id_token"]}`,
        },
      },
    );
    for (const task of (await result.json()) as ScheduledTaskRaw[]) {
      scheduledTasks.push({
        ID: task.ID,
        RunTimestamp: task.RunTimestamp,
        Body: JSON.parse(task.Body) as NewsArticleData,
      });
    }
  }
  return {
    articles,
    pageCount,
    allTags,
    likeForm: await superValidate(zod(likeSchema)),
    scheduledTasks: scheduledTasks,
  };
};

export const actions: Actions = {
  like: likesAction(true),
  dislike: likesAction(false),
};

type ScheduledTaskRaw = {
  ID: string;
  RunTimestamp: string;
  Body: string;
};

type ScheduledTaskParsed = {
  ID: string;
  RunTimestamp: string;
  Body: NewsArticleData;
};

type NewsArticleData = {
  author: {
    connect:
      | {
          id: string;
        }
      | undefined;
    create:
      | {
          member: {
            connect: {
              studentId: string | undefined;
            };
          };
          mandate:
            | {
                connect: {
                  member: {
                    studentId: string | undefined;
                  };
                  id: string;
                };
              }
            | undefined;
          customAuthor:
            | {
                connect: {
                  id: string;
                };
              }
            | undefined;
        }
      | undefined;
  };
  tags: {
    connect: Array<{
      id: string;
    }>;
  };
  publishedAt: Date;
  imageUrl?: string | null | undefined;
  imageUrls?: string[] | undefined;
  youtubeUrl?: string | null | undefined;
  slug: string;
  headerSv: string;
  headerEn: string | null;
  bodySv: string;
  bodyEn: string | null;
};
