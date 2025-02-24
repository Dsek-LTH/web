import getDirectusInstance from "$lib/server/directus";
import { readItem, readItems } from "@directus/sdk";
import { error } from "@sveltejs/kit";

export const load = async ({ locals, fetch, url }) => {
  const preview = url.searchParams.get("secret") === "secret";
  const id = parseInt(url.searchParams.get("id") ?? '1');

  const directus = getDirectusInstance(fetch);
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
  let res;
  try {
    res = await directus.request(readItem("Test", preview ? id : 1));
    console.log(res);
  } catch (e) {
    console.log(e);
  }
  return {
    phadderGroups,
    thing: res,
  };
};
