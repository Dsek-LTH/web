import getDirectusInstance from "$lib/server/directus";
import {
  readItem,
  readItems,
  readTranslation,
  readTranslations,
} from "@directus/sdk";
import { error } from "@sveltejs/kit";

export const load = async ({ locals, fetch, url }) => {
  const preview = url.searchParams.get("secret") === "secret";
  const id = parseInt(url.searchParams.get("id") ?? "1");

  const directus = await getDirectusInstance(fetch);
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
  console.log(await directus.request(readTranslations()));

  let res;
  try {
    res = (
      await directus.request(
        readItem("landing", preview ? id : 1, {
          deep: {
            translations: {
              _filter: {
                languages_code: {
                  _eq: locals.language,
                },
              },
            },
          },
          fields: ["translations.*"],
        })
      )
    )["translations"][0];
    console.log(res);
  } catch (e) {
    console.log(e);
  }
  return {
    phadderGroups,
    content: res,
  };
};
