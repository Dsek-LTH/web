import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const song = await locals.prisma.song.findFirst({
    where: {
      slug: params.slug,
      deletedAt: null,
    },
  });

  if (!song) {
    error(404, "Song not found");
  }

  return { song };
};
