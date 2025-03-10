import { getNollningCollectionData, getNollningPageData } from "$lib/server/directus";

export const load = async ({ locals, fetch, url }) => {
  const preview = url.searchParams.get("secret") === "secret";
  const version = preview
    ? (url.searchParams.get("version") ?? "main")
    : "main";

  const { prisma } = locals;
  const phadderGroups = await prisma.phadderGroup.findMany({
    where: {
      year: 2024,
    },
    include: {
      nollor: true,
      phaddrar: {
        include: {
          member: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  const content = await getNollningPageData(
    fetch,
    "landing",
    locals.language,
    version,
  );
  const stab = await getNollningCollectionData(
    fetch,
    "stab",
    locals.language,
    version,
  );
  console.log(stab)

  //const pepp = await getNollningCollectionData(
  //  fetch,
  //  "pepp",
  //  locals.language,
  //  version,
  //);

  return {
    phadderGroups,
    content,
    stab,
    pepp
  };
};
