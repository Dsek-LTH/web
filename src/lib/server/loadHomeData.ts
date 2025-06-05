import {
  PUBLIC_BUCKETS_DOCUMENTS,
  PUBLIC_MEDIAWIKI_ENDPOINT,
  PUBLIC_MINECRAFT_URL,
} from "$env/static/public";
import { BASIC_EVENT_FILTER } from "$lib/events/events";
import { fileHandler } from "$lib/files";
import { BASIC_ARTICLE_FILTER } from "$lib/news/articles";
import { error } from "@sveltejs/kit";
// eslint-disable-next-line no-restricted-imports -- problem with lib and api, feels unecessary to create a bunch of helper files just to structure this one thing
import type { GetCommitDataResponse } from "../../routes/(app)/api/home/+server";
import * as m from "$paraglide/messages";
import { pingUri, type IMinecraftData } from "minecraft-server-ping";
import { env } from "$env/dynamic/private";

export interface WikiChangeItem {
  type: string;
  ns: number;
  title: string;
  pageid: 41;
  revid: number;
  comment: string;
  parsedcomment: string;
  timestamp: string;
  user: string;
}

export interface WikiExtractItem {
  pageid: number;
  ns: number;
  title: string;
  extract: string;
}

export type WikiDataItem = WikiChangeItem & WikiExtractItem;

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
  const commitPromise = fetch("/api/home").then((res) =>
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
  const { loginToken, cookies: loginCookies } = await wikiLoginToken();
  const { cookies } = await wikiLoginSession(
    env.MEDIAWIKI_USERNAME,
    env.MEDIAWIKI_PASSWORD,
    loginToken,
    loginCookies,
  );

  const wikiChanges = await wikiApiRecentChanges(cookies);
  let changes = wikiChanges.query.recentchanges;
  let rccontinue: string | null = wikiChanges.continue.rccontinue;
  const removeChangesDuplicates = () =>
    changes.filter(
      (v, i) => changes.findIndex(({ title }) => v.title == title) == i,
    );
  changes = removeChangesDuplicates();
  while (changes.length < 3 && rccontinue) {
    const moreWikiChanges = await wikiApiRecentChanges(cookies, rccontinue);
    rccontinue = moreWikiChanges.continue
      ? moreWikiChanges.continue.rccontinue
      : null;
    changes = changes.concat(moreWikiChanges.query.recentchanges);
    changes = removeChangesDuplicates();
  }

  const wikiExtracts = await wikiApiExtract(
    cookies,
    changes.map((x) => x.pageid),
  );

  // Minecraft
  let minecraftStatus: IMinecraftData | null = null;
  try {
    minecraftStatus = await pingUri(PUBLIC_MINECRAFT_URL);
  } catch {
    console.log("Minecraft server unreachable");
  }

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
    wikiData: changes.map((c) =>
      Object.assign(c, wikiExtracts.query.pages[c.pageid]),
    ),
    minecraftStatus,
  };

  // Wiki Functions

  async function wikiLoginToken() {
    const params = new URLSearchParams({
      action: "query",
      meta: "tokens",
      type: "login",
      format: "json",
    });

    const res = await fetch(
      `${PUBLIC_MEDIAWIKI_ENDPOINT}?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const data = await res.json();
    const loginToken = data?.query?.tokens?.logintoken;

    if (!loginToken) {
      throw new Error("Login token not found");
    }
    return { loginToken, cookies: res.headers.get("set-cookie") ?? "" };
  }

  async function wikiLoginSession(
    wikiLgUsername: string,
    wikiLgPassword: string,
    loginToken: string,
    cookies: string,
  ) {
    const res = await fetch(PUBLIC_MEDIAWIKI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies || "",
      },
      body: new URLSearchParams({
        action: "login",
        lgname: wikiLgUsername,
        lgpassword: wikiLgPassword,
        lgtoken: loginToken,
        format: "json",
      }),
      credentials: "include",
    });
    return {
      data: await res.json(),
      cookies: res.headers.get("set-cookie") ?? "",
    };
  }

  async function wikiApiRecentChanges(
    cookies: string,
    rccontinue: string | undefined = undefined,
  ): Promise<{
    batchcomplete: string;
    continue: { rccontinue: string; continue: string };
    query: {
      recentchanges: WikiChangeItem[];
    };
  }> {
    const body = new URLSearchParams(
      Object.assign(
        {
          action: "query",
          list: "recentchanges",
          rcprop: "title|ids|comment|parsedcomment|flags|user|timestamp",
          rcnamespace: "0",
          rclimit: "3",
          format: "json",
        },
        rccontinue && { rccontinue },
      ),
    );
    console.log(body);

    const res = await fetch(PUBLIC_MEDIAWIKI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies || "",
      },
      body,
      credentials: "include",
    });
    return await res.json();
  }

  async function wikiApiExtract(
    cookies: string,
    pageIDs: number[],
  ): Promise<{ query: { pages: Record<string, WikiExtractItem> } }> {
    const res = await fetch(PUBLIC_MEDIAWIKI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies || "",
      },
      body: new URLSearchParams({
        action: "query",
        prop: "extracts",
        exlimit: "max",
        exintro: "true",
        exchars: "100",
        pageids: pageIDs.join("|"),
        explaintext: "true",
        format: "json",
      }),
      credentials: "include",
    });
    return await res.json();
  }
};
