import DOMPurify from "isomorphic-dompurify";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { BASIC_ARTICLE_FILTER } from "$lib/utils/articles";
import { fileHandler } from "$lib/files";
import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const { prisma, user } = locals;

  if (!user?.memberId) {
    redirect(302, "/");
  }

  /* files - subject to change */

  const year = new Date().getFullYear();
  const files = await Promise.all([
    ...(await fileHandler.getInBucket(
      user,
      PUBLIC_BUCKETS_DOCUMENTS,
      "meeting/" + year + "/",
      true,
    )),
  ]);

  const boardMeetingFileNameRegex = /^S\d+$/;
  const boardMeetings = Array.from(
    new Set(
      files
        .map((obj) => obj.id.split("/")[2])
        .filter((str) => boardMeetingFileNameRegex.test(str!))
        .map((str) => parseInt(str!.substring(1)))
        .sort(),
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

  /* files ends */

  const newsPromise = prisma.article
    .findMany({
      where: {
        ...BASIC_ARTICLE_FILTER(),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
    })
    .then((articles) =>
      articles.map((article) => ({
        ...article,
        body: DOMPurify.sanitize(article.body),
        bodyEn: article.bodyEn
          ? DOMPurify.sanitize(article.bodyEn)
          : article.bodyEn,
      })),
    );
  const eventsPromise = prisma.event
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
    );
  const upcomingMeetingPromise = prisma.meeting.findFirst({
    where: {
      date: {
        gt: new Date(),
      },
    },
    orderBy: {
      date: "asc",
    },
  });
  const previousMeetingPromise = prisma.meeting.findFirst({
    where: {
      date: {
        lt: new Date(),
      },
    },
    orderBy: {
      date: "desc",
    },
  });
  const cafeOpenPromise = prisma.markdown.findFirst({
    where: {
      name: `cafe:open:${new Date().getDay() - 1}`, // we assign monday to 0, not sunday
    },
  });
  const [news, events, upcomingMeeting, previousMeeting, cafeOpen] =
    await Promise.allSettled([
      newsPromise,
      eventsPromise,
      upcomingMeetingPromise,
      previousMeetingPromise,
      cafeOpenPromise,
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

  const commit = await fetch("/api/home");
  const commitData = await commit.json();
  return {
    files: { next: nextBoardMeetingFiles, last: lastBoardMeetingFiles },
    news: news.value,
    events: events.value,
    meetings: {
      upcoming: upcomingMeeting.value,
      previous: previousMeeting.value,
    },
    cafeOpen: cafeOpen.value,
    commitCount: commitData.commitCount,
    latestCommit: commitData.latestCommit,
  };
};
