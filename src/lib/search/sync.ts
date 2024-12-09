import { meilisearch } from "$lib/search/meilisearch";
import { v4 as uuid } from "uuid";
import {
  articleSearchableAttributes,
  availableSearchIndexes,
  committeeSearchableAttributes,
  eventSearchableAttributes,
  memberSearchableAttributes,
  positionSearchableAttributes,
  songSearchableAttributes,
  type ArticleSearchReturnAttributes,
  type CommitteeSearchReturnAttributes,
  type EventSearchReturnAttributes,
  type MemberSearchReturnAttributes,
  type PositionSearchReturnAttributes,
  type SongSearchReturnAttributes,
} from "$lib/search/searchTypes";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import type { EnqueuedTask, Index } from "meilisearch";
import type { PrismaClient } from "@prisma/client";

/**
 * Dumps relevant data from the database to Meilisearch.
 * Meilisearch basically has its own database, so we need to
 * keep it in sync with our own. This is done by calling this
 * function. It will then fetch all relevant data from the
 * database and dump it into Meilisearch.
 */
let meiliInitialized = false;
const sync = async () => {
  if (!meiliInitialized) {
    await waitForTasks(() =>
      availableSearchIndexes.map((index) => meilisearch.createIndex(index)),
    );
    meiliInitialized = true;
  }

  const { allIndexes, indexWithData } = await getRelevantSearchData();

  await waitForTasks(() =>
    allIndexes.map((index) => index.deleteAllDocuments()),
  );

  await waitForTasks(() =>
    indexWithData.map((obj) => {
      const index: Index = obj.index;
      return index.addDocuments(obj.documents, { primaryKey: "id" });
    }),
  );

  await waitForTasks(() =>
    allIndexes.map((index) => index.resetSearchableAttributes()),
  );

  await waitForTasks(() =>
    indexWithData.map((pair) =>
      pair.index.updateSearchableAttributes(pair.searchAbleAttributes),
    ),
  );

  return JSON.stringify(indexWithData);
};

export default sync;

// HELPER FUNCTIONS
async function waitForTasks(
  fn: () => Array<Promise<EnqueuedTask>>,
  timeOutMs = 10000,
) {
  const tasks = await Promise.all(fn());
  const taskUids = tasks.map((task) => task.taskUid);
  return meilisearch.waitForTasks(taskUids, { timeOutMs });
}

async function getIndexes(): Promise<{
  membersIndex: Index<MemberSearchReturnAttributes>;
  songsIndex: Index<SongSearchReturnAttributes>;
  articlesIndex: Index<ArticleSearchReturnAttributes>;
  eventsIndex: Index<EventSearchReturnAttributes>;
  positionsIndex: Index<PositionSearchReturnAttributes>;
  committeesIndex: Index<CommitteeSearchReturnAttributes>;
}> {
  const membersIndex = await meilisearch.getIndex("members");
  const songsIndex = await meilisearch.getIndex("songs");
  const articlesIndex = await meilisearch.getIndex("articles");
  const eventsIndex = await meilisearch.getIndex("events");
  const positionsIndex = await meilisearch.getIndex("positions");
  const committeesIndex = await meilisearch.getIndex("committees");
  return {
    membersIndex,
    songsIndex,
    articlesIndex,
    eventsIndex,
    positionsIndex,
    committeesIndex,
  };
}

async function getRelevantSearchData() {
  const { members, songs, articles, events, positions, committees } =
    await getDataFromPrisma(authorizedPrismaClient);
  const {
    membersIndex,
    songsIndex,
    articlesIndex,
    eventsIndex,
    positionsIndex,
    committeesIndex,
  } = await getIndexes();
  const allIndexes = [
    membersIndex,
    songsIndex,
    articlesIndex,
    eventsIndex,
    positionsIndex,
    committeesIndex,
  ];
  const indexWithData = [
    {
      index: membersIndex,
      documents: members,
      searchAbleAttributes: memberSearchableAttributes,
    },
    {
      index: songsIndex,
      documents: songs,
      searchAbleAttributes: songSearchableAttributes,
    },
    {
      index: articlesIndex,
      documents: articles,
      searchAbleAttributes: articleSearchableAttributes,
    },
    {
      index: eventsIndex,
      documents: events,
      searchAbleAttributes: eventSearchableAttributes,
    },
    {
      index: positionsIndex,
      documents: positions,
      searchAbleAttributes: positionSearchableAttributes,
    },
    {
      index: committeesIndex,
      documents: committees,
      searchAbleAttributes: committeeSearchableAttributes,
    },
  ] as const;
  return { allIndexes, indexWithData };
}

async function getDataFromPrisma(prisma: PrismaClient) {
  /**
   * For some odd reason, Meiliseach doesn't like the ID fields
   * we use in our database, so we generate new ones here.
   * They are just used internally in Meilisearch, so it's fine.
   * Perhaps generating UUIDs isn't needed in a future version of
   * Meilisearch.
   */
  const [members, songs, articles, events, positions, committees]: [
    MemberSearchReturnAttributes[],
    SongSearchReturnAttributes[],
    ArticleSearchReturnAttributes[],
    EventSearchReturnAttributes[],
    PositionSearchReturnAttributes[],
    CommitteeSearchReturnAttributes[],
  ] = await Promise.all([
    prisma.member
      .findMany({
        select: {
          studentId: true,
          firstName: true,
          lastName: true,
          nickname: true,
          picturePath: true,
          classYear: true,
          classProgramme: true,
        },
      })
      .then((members) =>
        members.map((member) => ({
          ...member,
          fullName: `${member.firstName} ${member.lastName}`,
          id: uuid(),
        })),
      ),
    prisma.song
      .findMany({
        select: {
          title: true,
          category: true,
          lyrics: true,
          melody: true,
          slug: true,
        },
        where: {
          deletedAt: null,
        },
      })
      .then((songs) =>
        songs.map((song) => ({
          ...song,
          id: uuid(),
        })),
      ),
    prisma.article
      .findMany({
        select: {
          body: true,
          bodyEn: true,
          header: true,
          headerEn: true,
          slug: true,
        },
        where: {
          AND: [
            {
              removedAt: null,
            },
            {
              publishedAt: {
                not: null,
              },
            },
          ],
        },
      })
      .then((articles) =>
        articles.map((article) => ({
          ...article,
          id: uuid(),
        })),
      ),
    prisma.event
      .findMany({
        select: {
          title: true,
          titleEn: true,
          description: true,
          descriptionEn: true,
          slug: true,
        },
        where: {
          AND: [
            {
              removedAt: null,
            },
          ],
        },
      })
      .then((events) =>
        events.map((event) => ({
          ...event,
          id: uuid(),
        })),
      ),
    prisma.position
      .findMany({
        select: {
          id: true,
          committeeId: true,
          committee: true,
          description: true,
          descriptionEn: true,
          name: true,
          nameEn: true,
        },
      })
      .then((positions) =>
        positions.map((position) => ({
          ...position,
          // ID is reserved in Meilisearch, so we use dsekId instead
          dsekId: position.id,
          committeeName: position.committee?.name ?? "",
          committeeNameEn: position.committee?.nameEn ?? "",
          id: uuid(),
        })),
      ),
    prisma.committee
      .findMany({
        select: {
          shortName: true,
          name: true,
          nameEn: true,
          description: true,
          descriptionEn: true,
          darkImageUrl: true,
          lightImageUrl: true,
          monoImageUrl: true,
        },
      })
      .then((committees) =>
        committees.map((committee) => ({
          ...committee,
          id: uuid(),
        })),
      ),
  ]);
  return { members, songs, articles, events, positions, committees };
}
