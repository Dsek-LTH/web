import { PUBLIC_BUCKETS_DOCUMENTS } from "$env/static/public";
import { BASIC_EVENT_FILTER } from "$lib/events/events";
import { fileHandler } from "$lib/files";
import { BASIC_ARTICLE_FILTER } from "$lib/news/articles";
import { error } from "@sveltejs/kit";
// eslint-disable-next-line no-restricted-imports -- problem with lib and api, feels unecessary to create a bunch of helper files just to structure this one thing
import type { GetCommitDataResponse } from "../../routes/(app)/api/home/+server";

type Fetch = typeof fetch;
export const loadHomeData = async ({
  locals,
  fetch,
}: {
  locals: App.Locals;
  fetch: Fetch;
}) => {
  const { prisma, user } = locals;

  /* files - subject to change */

  const now = new Date();
  const year = now.getFullYear();
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

  /* files ends */

  // NEWS
  const newsPromise = prisma.article.findMany({
    where: {
      ...BASIC_ARTICLE_FILTER(),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });

  // EVENTS
  const eventsPromise = prisma.event.findMany({
    where: {
      ...BASIC_EVENT_FILTER(),
      startDatetime: {
        gt: now,
      },
    },
    orderBy: {
      startDatetime: "asc",
    },
    take: 3,
  });

  // MEETINGS
  const upcomingMeetingPromise = prisma.meeting.findFirst({
    where: {
      date: {
        gt: now,
      },
    },
    orderBy: {
      date: "asc",
    },
  });
  const previousMeetingPromise = prisma.meeting.findFirst({
    where: {
      date: {
        lt: now,
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // CAFE OPENING TIMES
  const cafeOpenPromise = prisma.markdown.findFirst({
    where: {
      name: `cafe:open:${now.getDay() - 1}`, // we assign monday to 0, not sunday
    },
  });

  // COMMIT DATA
  const commitPromise = fetch("/api/home").then((res) =>
    res.json(),
  ) as Promise<GetCommitDataResponse>;

  // ACTIVE MANDATE?
  const hasActiveMandatePromise = prisma.mandate
    .findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        memberId: locals.user?.memberId,
      },
      select: {
        id: true,
      },
    })
    .then((res) => res !== null);

  const readmePromise = prisma.readme.findFirst();

  const [
    news,
    events,
    upcomingMeeting,
    previousMeeting,
    cafeOpen,
    commitData,
    hasActiveMandate,
    readme,
  ] = await Promise.allSettled([
    newsPromise,
    eventsPromise,
    upcomingMeetingPromise,
    previousMeetingPromise,
    cafeOpenPromise,
    commitPromise,
    hasActiveMandatePromise,
    readmePromise,
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
  if (hasActiveMandate.status === "rejected") {
    throw error(500, "Failed to fetch mandate data");
  }
  if (readme.status === "rejected") {
    throw error(500, "Failed to fetch readme");
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
    hasActiveMandate: hasActiveMandate.value,
    readme: readme.value,
  };
};
