import { getAllArticles } from "$lib/articles.js";

export async function GET({ url }) {
  const articles = await getAllArticles({
    tags: url.searchParams.getAll("tags"),
    search: url.searchParams.get("search") ?? undefined,
  });
  return new Response(JSON.stringify(articles));
}
