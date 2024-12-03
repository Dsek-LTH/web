import { meilisearch } from "$lib/search/meilisearch";
import type { RequestHandler } from "./$types";
import { v4 as uuid } from "uuid";
import {
  articleSearchableAttributesArray,
  eventSearchableAttributesArray,
  memberSearchableAttributesArray,
  positionSearchableAttributesArray,
  songSearchableAttributesArray,
  type SearchableArticleAttributes,
  type SearchableEventAttributes,
  type SearchableMemberAttributes,
  type SearchablePositionAttributes,
  type SearchableSongAttributes,
} from "$lib/search/searchTypes";

/**
 * Dumps relevant data from the database to Meilisearch.
 * Meilisearch basically has its own database, so we need to
 * keep it in sync with our own. This is done by doing a GET
 * request to this endpoint. It will then fetch all relevant
 * data from the database and dump it into Meilisearch.
 * It will deny access if the request is not from localhost,
 * to prevent public access to this endpoint.
 */
let meiliInitialized = false;
export const GET: RequestHandler = async ({ locals, getClientAddress }) => {
  // Deny access if not localhost
  const ip = getClientAddress();
  if (!(ip === "localhost" || ip === "::1" || ip === "127.0.0.1")) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!meiliInitialized) {
    await Promise.all([
      meilisearch.createIndex("positions"),
      meilisearch.createIndex("members"),
      meilisearch.createIndex("songs"),
      meilisearch.createIndex("articles"),
      meilisearch.createIndex("events"),
    ]);
    meiliInitialized = true;
    // sleep for a bit to let Meilisearch finish creating the indexes
    // otherwise, we can get a 500 error (but we can try again)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const prisma = locals.prisma;

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
    prisma.member
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
        membersIndex.updateSearchableAttributes(
          memberSearchableAttributesArray,
        ),
        songsIndex.updateSearchableAttributes(songSearchableAttributesArray),
        articlesIndex.updateSearchableAttributes(
          articleSearchableAttributesArray,
        ),
        eventsIndex.updateSearchableAttributes(eventSearchableAttributesArray),
        positionsIndex.updateSearchableAttributes(
          positionSearchableAttributesArray,
        ),
      ].map((task) => task.then((task) => task.taskUid)),
    ),
    { timeOutMs: 10000 },
  );

  return new Response(
    JSON.stringify({ members, songs, articles, events, positions }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
