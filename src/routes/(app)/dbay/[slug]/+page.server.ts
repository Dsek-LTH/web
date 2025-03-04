import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { error } from "@sveltejs/kit";

export const load = async (event) => {
  const { locals, params } = event;
  const { prisma, user } = locals;
  authorize(apiNames.MEMBER.READ, user);

  const dbay = await prisma.dbay.findUnique({
    where: {
      slug: params.slug,
    },
  });

  if (dbay == undefined) {
    throw error(404, {
      message: "Article not found",
    });
  }

  return { dbay };
};
