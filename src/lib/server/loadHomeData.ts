import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import { BASIC_ARTICLE_FILTER } from "$lib/utils/articles";
import { CacheDependency } from "$lib/utils/caching/cache";
import { globallyCached, userLevelCached } from "$lib/utils/caching/cached";
import type { PrismaClient } from "@prisma/client";
import { error } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";
import DOMPurify from "isomorphic-dompurify";

const getDocumentsData = async (user: AuthUser) => {
  /* files - subject to change */
  const year = new Date().getFullYear();
  const files = await fileHandler.getInBucket(
    user,
    PUBLIC_BUCKETS_DOCUMENTS,
    "public/" + year + "/",
    true,
  );

  const boardMeetingFileNameRegex = /^S\d+$/;
  const boardMeetings = Array.from(
    new Set(
      files
        .map((obj) => obj.id.split("/")[2])
        .filter((str) => boardMeetingFileNameRegex.test(str!))
        .map((str) => parseInt(str!.substring(1)))
        .sort((a, b) => a - b),
    ),
  );

  const nextBoardMeeting = boardMeetings.pop();
  const lastBoardMeeting = boardMeetings.pop();

  function filterFilesByBoardMeeting(boardMeeting: number | undefined) {
    return boardMeeting === undefined
      ? []
      : files.filter((obj) => obj.id.split("/")[2] === "S" + boardMeeting);
  }

  const nextBoardMeetingFiles = filterFilesByBoardMeeting(nextBoardMeeting);
  const lastBoardMeetingFiles = filterFilesByBoardMeeting(lastBoardMeeting);
  return {
    nextBoardMeetingFiles,
    lastBoardMeetingFiles,
  };
};

const _loadHomeData = async (
  user: AuthUser,
  prisma: PrismaClient,
  fetch: Fetch,
) => {
  const { nextBoardMeetingFiles, lastBoardMeetingFiles } =
    await userLevelCached(user, "home/documents", getDocumentsData, [
      CacheDependency.MEETINGS,
    ]);

  // NEWS
  const newsPromise = userLevelCached(
    user,
    "home/news",
    () =>
      prisma.article
        .findMany({
          where: {
            ...BASIC_ARTICLE_FILTER(),
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
        })
        .then((articles) =>
          articles.map((article) => ({
            ...article,
            body: DOMPurify.sanitize(article.body),
            bodyEn: article.bodyEn
              ? DOMPurify.sanitize(article.bodyEn)
              : article.bodyEn,
          })),
        ),
    [CacheDependency.NEWS],
  );

  // EVENTS
  const eventsPromise = userLevelCached(
    user,
    "home/events",
    () =>
      prisma.event
        .findMany({
          where: {
            startDatetime: {
              gt: new Date(),
            },
          },
          orderBy: {
            startDatetime: "asc",
          },
          take: 3,
        })
        .then((events) =>
          events.map((event) => ({
            ...event,
            description: DOMPurify.sanitize(event.description),
            descriptionEn: event.descriptionEn
              ? DOMPurify.sanitize(event.descriptionEn)
              : event.descriptionEn,
          })),
        ),
    [CacheDependency.EVENTS],
  );

  // MEETINGS
  const upcomingMeetingPromise = userLevelCached(
    user,
    "home/upcomingMeetings",
    () =>
      prisma.meeting.findFirst({
        where: {
          date: {
            gt: new Date(),
          },
        },
        orderBy: {
          date: "asc",
        },
      }),
    [CacheDependency.MEETINGS],
  );
  const previousMeetingPromise = userLevelCached(
    user,
    "home/previousMeetings",
    () =>
      prisma.meeting.findFirst({
        where: {
          date: {
            lt: new Date(),
          },
        },
        orderBy: {
          date: "desc",
        },
      }),
    [CacheDependency.MEETINGS],
  );

  // CAFE OPENING TIMES
  const cafeOpenPromise = globallyCached(CacheDependency.CAFE_OPEN_TIMES, () =>
    prisma.markdown.findFirst({
      where: {
        name: `cafe:open:${new Date().getDay() - 1}`, // we assign monday to 0, not sunday
      },
    }),
  );

  // COMMIT DATA
  const commitPromise = globallyCached("commitData", async () => {
    const res = await fetch("/api/home");
    if (!res.ok) throw new Error("Failed to fetch commit data");
    const body = await res.json();
    return body;
  });

  const [news, events, upcomingMeeting, previousMeeting, cafeOpen, commitData] =
    await Promise.allSettled([
      newsPromise,
      eventsPromise,
      upcomingMeetingPromise,
      previousMeetingPromise,
      cafeOpenPromise,
      commitPromise,
    ]);
  if (news.status === "rejected") {
    throw error(500, "Failed to fetch news");
  }
  if (events.status === "rejected") {
    throw error(500, "Failed to fetch events");
  }
  if (upcomingMeeting.status === "rejected") {
    throw error(500, "Failed to fetch upcoming meeting");
  }
  if (previousMeeting.status === "rejected") {
    throw error(500, "Failed to fetch previous meeting");
  }
  if (cafeOpen.status === "rejected") {
    throw error(500, "Failed to fetch cafe open");
  }
  if (commitData.status === "rejected") {
    throw error(500, "Failed to fetch commit data");
  }

  return {
    files: { next: nextBoardMeetingFiles, last: lastBoardMeetingFiles },
    news: news.value,
    events: events.value,
    meetings: {
      upcoming: upcomingMeeting.value,
      previous: previousMeeting.value,
    },
    cafeOpen: cafeOpen.value,
    commitCount: commitData.value.commitCount,
    latestCommit: commitData.value.latestCommit,
  };
};

type Fetch = typeof fetch;
export const loadHomeData = async ({
  locals,
  fetch,
}: {
  locals: App.Locals;
  fetch: Fetch;
}) => {
  const { prisma, user } = locals;

  return userLevelCached(
    user,
    "home",
    _loadHomeData,
    [CacheDependency.MEETINGS, CacheDependency.NEWS, CacheDependency.EVENTS],
    undefined,
    prisma,
    fetch,
  );
};
