import apiNames from "$lib/utils/apiNames";
import { authorise } from "$lib/utils/authorization";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorise(apiNames.DOOR.READ, user);

  const doors = await prisma.door.findMany();
  return {
    doors,
    slug: params.slug,
  };
};
