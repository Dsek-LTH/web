import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.DOOR.READ, user);

  const doors = await prisma.door.findMany();
  return {
    doors,
    slug: params.slug,
  };
};
