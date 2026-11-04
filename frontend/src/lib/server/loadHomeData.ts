import { env } from "$env/dynamic/private";
import { serverApi } from "$lib/server/apiClient";
import type { components } from "$lib/api/schema";
import { error, type RequestEvent } from "@sveltejs/kit";
// eslint-disable-next-line no-restricted-imports -- problem with lib and api, feels unnecessary to create a bunch of helper files just to structure this one thing
import type { GetCommitDataResponse } from "../../routes/(app)/api/home/+server";
import * as m from "$paraglide/messages";
import { pingUri } from "minecraft-server-ping";
import { wikiDataCache } from "./wiki/wiki";
import dayjs from "dayjs";

type Meeting = components["schemas"]["Meeting"];

export type BoardMeetingFiles = {
  name: string;
  files: Array<components["schemas"]["StoredFile"]>;
};

const boardMeetingFiles = (meeting: Meeting): BoardMeetingFiles => ({
  name: meeting.name,
  files: [
    meeting.notice,
    meeting.agenda,
    meeting.minutes,
    ...(meeting.files ?? []),
  ].filter((file) => file !== undefined),
});

export const loadHomeData = async (event: RequestEvent) => {
  const { fetch } = event;
  const api = serverApi(event);

  /* files - subject to change */

  const now = new Date();
  const year = now.getFullYear();
  // This year's board meetings (folders named S01, S02, ...): the highest
  // number is the next meeting, the one before it the last.
  const boardMeetings = await api
    .GET("/meeting-documents", {
      params: { query: { type: "board-meeting", year } },
    })
    .then((res) =>
      (res.data ?? [])
        .filter((meeting) => /^S\d+$/.test(meeting.name))
        .sort(
          (a, b) =>
            parseInt(a.name.substring(1)) - parseInt(b.name.substring(1)),
        ),
    );
  const nextBoardMeeting = boardMeetings.pop();
  const lastBoardMeeting = boardMeetings.pop();

  // NEWS
  // Ordered by publishedAt (the Go API's only order), not createdAt like
  // the old query - these only diverge for an article edited well after a
  // scheduled publish, which doesn't matter for a 3-item homepage widget.
  const newsPromise = api
    .GET("/articles", { params: { query: { pageSize: 4 } } })
    .then((res) => res.data?.articles ?? []);

  const startDate = dayjs(now).startOf("day").toDate();
  const endDate = dayjs(now).add(6, "day").endOf("day").toDate();

  // EVENTS
  // Every event overlapping this week, from Go's range listing (upstream
  // switched this to an overlap check too).
  const eventsPromise = api
    .GET("/events", {
      params: {
        query: {
          span: "range",
          from: startDate.toISOString(),
          to: endDate.toISOString(),
          pageSize: 500,
        },
      },
    })
    .then((res) =>
      (res.data?.events ?? []).map((event) => ({
        ...event,
        startDatetime: new Date(event.startAt),
        endDatetime: new Date(event.endAt),
      })),
    );

  // CAFE OPENING TIMES
  const cafeOpenPromise = api.GET("/cafe/opening-hours").then((res) =>
    (res.data ?? []).find(
      (hours) => hours.name === `cafe:open:${now.getDay() - 1}`, // we assign monday to 0, not sunday
    ),
  );

  // COMMIT DATA
  const commitPromise = fetch(`/api/home`).then((res) =>
    res.json(),
  ) as Promise<GetCommitDataResponse>;

  // RANDOM WELLBEING MESSAGE
  const wellbeing_random_sentence = [
    m.home_happened(),
    m.home_weird(),
    m.home_talk(),
    m.home_not_good(),
    m.home_change(),
  ].at(Math.floor(Math.random() * 5))!;

  // Elections
  // Ordered soonest-closing first (the Go API's only order for this list),
  // not newest-announced first like the old query - a deliberate
  // simplification for a 3-item homepage widget rather than adding a
  // second order variant to the endpoint (see DESIGN.md's "Elections"
  // section).
  const electionsPromise = api
    .GET("/elections")
    .then((res) => (res.data ?? []).slice(0, 3));

  const birthdaysPromise = event.locals.user?.memberId
    ? api
        .GET("/members", { params: { query: { birthdayToday: true } } })
        .then((res) => res.data ?? [])
    : Promise.resolve([]);

  const [news, events, cafeOpen, commitData, elections, birthdays] =
    await Promise.allSettled([
      newsPromise,
      eventsPromise,
      cafeOpenPromise,
      commitPromise,
      electionsPromise,
      birthdaysPromise,
    ]);
  if (news.status === "rejected") {
    throw error(500, "Failed to fetch news");
  }
  if (events.status === "rejected") {
    throw error(500, "Failed to fetch events");
  }
  if (cafeOpen.status === "rejected") {
    throw error(500, "Failed to fetch cafe open");
  }
  if (commitData.status === "rejected") {
    throw error(500, "Failed to fetch commit data");
  }
  if (elections.status === "rejected") {
    throw error(500, "Failed to fetch elections");
  }

  // WIKI

  const minecraftStatus = async () => {
    try {
      return await pingUri(env.MINECRAFT_URL, { timeout: 2000 });
    } catch {
      console.log("Error, minecraft timed out");
      return null;
    }
  };

  return {
    wellbeing: wellbeing_random_sentence,
    boardMeetings: {
      next: nextBoardMeeting && boardMeetingFiles(nextBoardMeeting),
      last: lastBoardMeeting && boardMeetingFiles(lastBoardMeeting),
    },
    news: news.value,
    events: events.value,
    cafeOpen: cafeOpen.value,
    commitCount: commitData.value.commitCount,
    latestCommit: commitData.value.latestCommit,
    wikiData: await wikiDataCache.get(),
    minecraftStatus: minecraftStatus(),
    elections: elections.value,
    birthdays: birthdays.status === "fulfilled" ? birthdays.value : [],
  };
};
