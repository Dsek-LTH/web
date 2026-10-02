import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;

  const doors = await prisma.door.findMany();
  return {
    doors,
    slug: params.slug,
  };
};
