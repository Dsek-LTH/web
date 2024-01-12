import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { fail, type Actions } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/client";
import { createSongSchema } from "./schema";
import type { PageServerLoad } from "./$types";
import type { Song } from "@prisma/client";

export const load: PageServerLoad = async ({ parent }) => {
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.SONG.CREATE, accessPolicies);

  const existingCategories = (
    await prisma.song.findMany({
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
    })
  ).reduce<Array<NonNullable<Song["category"]>>>((acc, cur) => {
    if (cur.category !== null) {
      acc.push(cur.category);
    }
    return acc;
  }, []);

  const existingMelodies = (
    await prisma.song.findMany({
      distinct: ["melody"],
      orderBy: {
        melody: "asc",
      },
    })
  ).reduce<Array<NonNullable<Song["melody"]>>>((acc, cur) => {
    if (cur.melody !== null) {
      acc.push(cur.melody);
    }
    return acc;
  }, []);

  return {
    form: await superValidate(createSongSchema),
    accessPolicies,
    existingCategories,
    existingMelodies,
  };
};

export const actions = {
  create: async (event) => {
    const form = await superValidate(event.request, createSongSchema);
    if (!form.valid) return fail(400, { form });
    const session = await event.locals.getSession();
    return withAccess(apiNames.SONG.CREATE, session?.user, async () => {
      const { title, melody, category, lyrics } = form.data;
      const now = new Date();
      const result = await prisma.song.create({
        data: {
          title: title,
          melody: melody,
          category: category,
          lyrics: lyrics,
          createdAt: now,
          updatedAt: now,
        },
      });
      throw redirect(
        `/songbook/${result.title}`,
        {
          message: "Sång skapad",
          type: "success",
        },
        event,
      );
    });
  },
} satisfies Actions;
