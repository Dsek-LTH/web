import type { RequestHandler } from "@sveltejs/kit";

export const DELETE: RequestHandler = async ({ url, locals }) => {
  const { prisma } = locals;

  const id = url.searchParams.get("id")!;

  await prisma.drinkItemBatch.delete({
    where: { id: id },
  });

  return new Response(null, { status: 204 });
};
