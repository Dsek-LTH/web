import { meilisearch } from "$lib/search/meilisearch";
import { v4 as uuid } from "uuid";
import {
  articleSearchableAttributes,
  eventSearchableAttributes,
  memberSearchableAttributes,
  positionSearchableAttributes,
  songSearchableAttributes,
  type SearchableArticleAttributes,
  type SearchableEventAttributes,
  type SearchableMemberAttributes,
  type SearchablePositionAttributes,
  type SearchableSongAttributes,
} from "$lib/search/searchTypes";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";

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
    await meilisearch.waitForTasks(
      await Promise.all(
        [
          // createIndex is idempotent - calling it multiple times is fine
          meilisearch.createIndex("positions"),
          meilisearch.createIndex("members"),
          meilisearch.createIndex("songs"),
          meilisearch.createIndex("articles"),
          meilisearch.createIndex("events"),
        ].map((task) => task.then((task) => task.taskUid)),
      ),
      { timeOutMs: 10000 },
    );
    meiliInitialized = true;
  }

  /**
   * For some odd reason, Meiliseach doesn't like the ID fields
   * we use in our database, so we generate new ones here.
   * They are just used internally in Meilisearch, so it's fine.
   * Perhaps generating UUIDs isn't needed in a future version of
   * Meilisearch.
   */
  const [members, songs, articles, events, positions]: [
    SearchableMemberAttributes[],
    SearchableSongAttributes[],
    SearchableArticleAttributes[],
    SearchableEventAttributes[],
    SearchablePositionAttributes[],
  ] = await Promise.all([
    authorizedPrismaClient.member
      .findMany({
        select: {
          studentId: true,
          firstName: true,
          lastName: true,
          nickname: true,
          picturePath: true,
          classYear: true,
        },
      })
      .then((members) =>
        members.map((member) => ({
          ...member,
          fullName: `${member.firstName} ${member.lastName}`,
          id: uuid(),
        })),
      ),
    authorizedPrismaClient.song
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
    authorizedPrismaClient.article
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
    authorizedPrismaClient.event
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
    authorizedPrismaClient.position
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
  ]);

  const [membersIndex, songsIndex, articlesIndex, eventsIndex, positionsIndex] =
    await Promise.all([
      meilisearch.getIndex("members"),
      meilisearch.getIndex("songs"),
      meilisearch.getIndex("articles"),
      meilisearch.getIndex("events"),
      meilisearch.getIndex("positions"),
    ]);

  await meilisearch.waitForTasks(
    await Promise.all(
      [
        membersIndex.deleteAllDocuments(),
        songsIndex.deleteAllDocuments(),
        articlesIndex.deleteAllDocuments(),
        eventsIndex.deleteAllDocuments(),
        positionsIndex.deleteAllDocuments(),
      ].map((task) => task.then((task) => task.taskUid)),
    ),
    { timeOutMs: 10000 },
  );

  await meilisearch.waitForTasks(
    await Promise.all(
      [
        membersIndex.addDocuments(members, {
          primaryKey: "id",
        }),
        songsIndex.addDocuments(songs, {
          primaryKey: "id",
        }),
        articlesIndex.addDocuments(articles, {
          primaryKey: "id",
        }),
        eventsIndex.addDocuments(events, {
          primaryKey: "id",
        }),
        positionsIndex.addDocuments(positions, {
          primaryKey: "id",
        }),
      ].map((task) => task.then((task) => task.taskUid)),
    ),
    { timeOutMs: 10000 },
  );

  await meilisearch.waitForTasks(
    await Promise.all(
      [
        membersIndex.resetSearchableAttributes(),
        songsIndex.resetSearchableAttributes(),
        articlesIndex.resetSearchableAttributes(),
        eventsIndex.resetSearchableAttributes(),
        positionsIndex.resetSearchableAttributes(),
      ].map((task) => task.then((task) => task.taskUid)),
    ),
    { timeOutMs: 10000 },
  );

  await meilisearch.waitForTasks(
    await Promise.all(
      [
        membersIndex.updateSearchableAttributes(memberSearchableAttributes),
        songsIndex.updateSearchableAttributes(songSearchableAttributes),
        articlesIndex.updateSearchableAttributes(articleSearchableAttributes),
        eventsIndex.updateSearchableAttributes(eventSearchableAttributes),
        positionsIndex.updateSearchableAttributes(positionSearchableAttributes),
      ].map((task) => task.then((task) => task.taskUid)),
    ),
    { timeOutMs: 10000 },
  );

  return { members, songs, articles, events, positions };
};
export default sync;
