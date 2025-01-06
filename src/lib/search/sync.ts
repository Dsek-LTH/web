import { meilisearch } from "$lib/search/meilisearch";
import { prismaIdToMeiliId } from "$lib/search/searchHelpers";
import {
  availableSearchIndexes,
  meilisearchConstants,
  type ArticleDataInMeilisearch,
  type CommitteeDataInMeilisearch,
  type EventDataInMeilisearch,
  type MemberDataInMeilisearch,
  type PositionDataInMeilisearch,
  type SongDataInMeilisearch,
} from "$lib/search/searchTypes";
import {
  addDataToIndex,
  resetIndex,
  setRulesForIndex,
  waitForTask,
} from "$lib/search/syncHelpers";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import { syncGoverningDocuments } from "$lib/search/syncDocuments";

// To try to lower the memory usage, we only fetch 1000 items at a time.
// The sync doesn't need to be super fast, so this is fine.
const BATCH_SIZE = 1000;

/**
 * Dumps relevant data from the database to Meilisearch.
 * Meilisearch basically has its own database, so we need to
 * keep it in sync with our own. This is done by calling this
 * function. It will then fetch all relevant data from the
 * database and dump it into Meilisearch.
 */
let meiliInitialized = false;
const sync = async () => {
  const currentTime = Date.now();
  console.log("Meilisearch: Syncing data");
  if (!meiliInitialized) {
    console.log("Meilisearch: Initializing");
    for (const index of availableSearchIndexes) {
      await waitForTask(
        () => meilisearch.createIndex(index),
        `Creating index ${index}`,
      );
    }
    meiliInitialized = true;
  }

  await syncMembers();
  await syncSongs();
  await syncArticles();
  await syncEvents();
  await syncPositions();
  await syncCommittees();
  await syncGoverningDocuments();

  console.log(`Meilisearch: Data synced. Took ${Date.now() - currentTime} ms`);
  return "Data synced";
};

export default sync;

async function syncMembers() {
  const numMembers = await authorizedPrismaClient.member.count();
  const membersIndex = await meilisearch.getIndex("members");
  await resetIndex(membersIndex, meilisearchConstants.member);
  for (let i = 0; i < numMembers; i += BATCH_SIZE) {
    const members: MemberDataInMeilisearch[] =
      await authorizedPrismaClient.member
        .findMany({
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            nickname: true,
            picturePath: true,
            classYear: true,
            classProgramme: true,
          },
          skip: i,
          take: BATCH_SIZE,
          orderBy: {
            studentId: "asc",
          },
        })
        .then((members) =>
          members.map((member) => ({
            ...member,
            fullName: `${member.firstName} ${member.lastName}`,
            id: prismaIdToMeiliId(member.id),
          })),
        );
    await addDataToIndex(membersIndex, members);
  }
  await setRulesForIndex(membersIndex, meilisearchConstants.member);
}

async function syncSongs() {
  const numSongs = await authorizedPrismaClient.song.count();
  const songsIndex = await meilisearch.getIndex("songs");
  await resetIndex(songsIndex, meilisearchConstants.song);
  for (let i = 0; i < numSongs; i += BATCH_SIZE) {
    const songs: SongDataInMeilisearch[] = await authorizedPrismaClient.song
      .findMany({
        select: {
          id: true,
          title: true,
          category: true,
          lyrics: true,
          melody: true,
          slug: true,
        },
        where: {
          deletedAt: null,
        },
        skip: i,
        take: BATCH_SIZE,
        orderBy: {
          title: "asc",
        },
      })
      .then((songs) =>
        songs.map((song) => ({
          ...song,
          id: prismaIdToMeiliId(song.id),
        })),
      );
    await addDataToIndex(songsIndex, songs);
  }
  await setRulesForIndex(songsIndex, meilisearchConstants.song);
}

async function syncArticles() {
  const numArticles = await authorizedPrismaClient.article.count();
  const articlesIndex = await meilisearch.getIndex("articles");
  await resetIndex(articlesIndex, meilisearchConstants.article);
  for (let i = 0; i < numArticles; i += BATCH_SIZE) {
    const articles: ArticleDataInMeilisearch[] =
      await authorizedPrismaClient.article
        .findMany({
          select: {
            id: true,
            body: true,
            bodyEn: true,
            header: true,
            headerEn: true,
            slug: true,
            publishedAt: true,
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
          skip: i,
          take: BATCH_SIZE,
          orderBy: {
            publishedAt: "asc",
          },
        })
        .then((articles) =>
          articles.map((article) => ({
            ...article,
            id: prismaIdToMeiliId(article.id),
          })),
        );
    await addDataToIndex(articlesIndex, articles);
  }
  await setRulesForIndex(articlesIndex, meilisearchConstants.article);
}

async function syncEvents() {
  const numEvents = await authorizedPrismaClient.event.count();
  const eventsIndex = await meilisearch.getIndex("events");
  await resetIndex(eventsIndex, meilisearchConstants.event);
  for (let i = 0; i < numEvents; i += BATCH_SIZE) {
    const events: EventDataInMeilisearch[] = await authorizedPrismaClient.event
      .findMany({
        select: {
          id: true,
          title: true,
          titleEn: true,
          description: true,
          descriptionEn: true,
          slug: true,
          startDatetime: true,
        },
        where: {
          AND: [
            {
              removedAt: null,
            },
          ],
        },
        skip: i,
        take: BATCH_SIZE,
        orderBy: {
          startDatetime: "asc",
        },
      })
      .then((events) =>
        events.map((event) => ({
          ...event,
          id: prismaIdToMeiliId(event.id),
        })),
      );
    await addDataToIndex(eventsIndex, events);
  }
  await setRulesForIndex(eventsIndex, meilisearchConstants.event);
}

async function syncPositions() {
  const numPositions = await authorizedPrismaClient.position.count();
  const positionsIndex = await meilisearch.getIndex("positions");
  await resetIndex(positionsIndex, meilisearchConstants.position);
  for (let i = 0; i < numPositions; i += BATCH_SIZE) {
    const positions: PositionDataInMeilisearch[] =
      await authorizedPrismaClient.position
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
          skip: i,
          take: BATCH_SIZE,
          orderBy: {
            name: "asc",
          },
        })
        .then((positions) =>
          positions.map((position) => ({
            ...position,
            // ID is reserved in Meilisearch, so we use dsekId instead
            dsekId: position.id,
            committeeName: position.committee?.name ?? "",
            committeeNameEn: position.committee?.nameEn ?? "",
            id: prismaIdToMeiliId(position.id),
          })),
        );
    await addDataToIndex(positionsIndex, positions);
  }
  await setRulesForIndex(positionsIndex, meilisearchConstants.position);
}

async function syncCommittees() {
  const numCommittees = await authorizedPrismaClient.committee.count();
  const committeesIndex = await meilisearch.getIndex("committees");
  await resetIndex(committeesIndex, meilisearchConstants.committee);
  for (let i = 0; i < numCommittees; i += BATCH_SIZE) {
    const committees: CommitteeDataInMeilisearch[] =
      await authorizedPrismaClient.committee
        .findMany({
          select: {
            id: true,
            shortName: true,
            name: true,
            nameEn: true,
            description: true,
            descriptionEn: true,
            darkImageUrl: true,
            lightImageUrl: true,
            monoImageUrl: true,
          },
          skip: i,
          take: BATCH_SIZE,
          orderBy: {
            shortName: "asc",
          },
        })
        .then((committees) =>
          committees.map((committee) => ({
            ...committee,
            id: prismaIdToMeiliId(committee.id),
          })),
        );
    await addDataToIndex(committeesIndex, committees);
  }
  await setRulesForIndex(committeesIndex, meilisearchConstants.committee);
}
