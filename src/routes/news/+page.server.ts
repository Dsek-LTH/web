import { articles } from "$lib/articles";
import type { PageServerLoad } from "./$types";
import { marked } from "marked";
import { sanitize } from "isomorphic-dompurify";

export const load: PageServerLoad = ({ url }) => {
  return {
    articles: articles
      .map((article) => {
        return {
          ...article,
          body: sanitize(marked.parse(article.body)),
          bodyEn: sanitize(marked.parse(article.bodyEn))
        };
      })
      .filter((article) => {
        const query = (url.searchParams.get("search") ?? "").toLowerCase();
        return (
          article.header.toLowerCase().includes(query) || article.body.toLowerCase().includes(query)
        );
      })
  };
};
