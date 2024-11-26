import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, getClientAddress }) => {
  // Deny access if not localhost
  const ip = getClientAddress();
  if (!(ip === "localhost" || ip === "::1" || ip === "127.0.0.1")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const prisma = locals.prisma;

  const members = await prisma.member.findMany({
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      nickname: true,
    },
  });
  const songs = await prisma.song.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      lyrics: true,
      melody: true,
    },
    where: {
      deletedAt: null,
    },
  });
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      body: true,
      bodyEn: true,
      header: true,
      headerEn: true,
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
  });
  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      titleEn: true,
      description: true,
      descriptionEn: true,
    },
    where: {
      AND: [
        {
          removedAt: null,
        },
      ],
    },
  });
  const positions = await prisma.position.findMany({
    select: {
      committee: true,
      description: true,
      descriptionEn: true,
      name: true,
      nameEn: true,
    },
  });

  const meilisearch = locals.meilisearch;
  await Promise.all([
    meilisearch.createIndex("members"),
    meilisearch.createIndex("songs"),
    meilisearch.createIndex("articles"),
    meilisearch.createIndex("events"),
    meilisearch.createIndex("positions"),
  ]);

  const [membersIndex, songsIndex, articlesIndex, eventsIndex, positionsIndex] =
    await Promise.all([
      meilisearch.getIndex("members"),
      meilisearch.getIndex("songs"),
      meilisearch.getIndex("articles"),
      meilisearch.getIndex("events"),
      meilisearch.getIndex("positions"),
    ]);

  await Promise.all([
    membersIndex.addDocuments(
      members.map((member) => ({
        ...member,
        name: `${member.firstName} ${member.lastName}`,
      })),
    ),
    songsIndex.addDocuments(songs),
    articlesIndex.addDocuments(articles),
    eventsIndex.addDocuments(events),
    positionsIndex.addDocuments(positions),
  ]);

  return new Response(
    JSON.stringify({ members, songs, articles, events, positions }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
