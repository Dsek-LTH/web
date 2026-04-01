import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_MINECRAFT_URL,
} from "$env/static/public";
import { BASIC_EVENT_FILTER } from "$lib/events/events";
import { fileHandler } from "$lib/files";
import { BASIC_ARTICLE_FILTER } from "$lib/news/articles";
import { error } from "@sveltejs/kit";
// eslint-disable-next-line no-restricted-imports -- problem with lib and api, feels unnecessary to create a bunch of helper files just to structure this one thing
import type { GetCommitDataResponse } from "../../routes/(app)/api/home/+server";
import * as m from "$paraglide/messages";
import { pingUri } from "minecraft-server-ping";
import { wikiDataCache } from "./wiki/wiki";

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
  const files = await fileHandler
    .getInBucket(user, PUBLIC_BUCKETS_DOCUMENTS, "public/" + year + "/", true)
    .catch((err) => {
      console.error("Error fetching files", err);
      return [];
    });

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
      : files.filter(
          (obj) =>
            obj.id.split("/")[2] ===
            "S" + (boardMeeting < 10 ? "0" : "") + boardMeeting,
        );
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
  const commitPromise = fetch(
    `${locals.language === "en" ? "/en" : ""}/api/home`,
  ).then((res) => res.json()) as Promise<GetCommitDataResponse>;

  // RANDOM WELLBEING MESSAGE
  const wellbeing_random_sentence = [
    m.home_happened(),
    m.home_weird(),
    m.home_talk(),
    m.home_not_good(),
    m.home_change(),
  ].at(Math.floor(Math.random() * 5))!;

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

  const readmePromise = prisma.readme.findMany({
    orderBy: {
      publishedAt: "desc",
    },
    take: 4,
  });

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

  // WIKI

  const minecraftStatus = async () => {
    try {
      return await pingUri(PUBLIC_MINECRAFT_URL, { timeout: 2000 });
    } catch {
      console.log("Error, minecraft timed out");
      return null;
    }
  };

  return {
    wellbeing: wellbeing_random_sentence,
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
    readmeIssues: readme.value,
    wikiData: await wikiDataCache.get(),
    minecraftStatus: minecraftStatus(),
  };
};
