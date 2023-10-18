import { getArticle } from "../articles";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { hasAccess } from "$lib/access";
import apiNames from "$lib/apiNames";

export const load: PageServerLoad = async ({ params, parent }) => {
  const article = await getArticle(params.slug);
  if (article == undefined) {
    throw error(404, {
      message: "Not found",
    });
  }
  const { session } = await parent();
  const canEdit = await hasAccess(
    [apiNames.NEWS.UPDATE, apiNames.NEWS.MANAGE],
    session?.user,
    article.author.member.id
  );
  return {
    article,
    canEdit,
  };
};
