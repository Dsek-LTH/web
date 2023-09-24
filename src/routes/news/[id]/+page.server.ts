import { articles } from '$lib/articles';
import { marked } from 'marked';
import type { PageServerLoad } from './$types';
import { sanitize } from "isomorphic-dompurify";

export const load: PageServerLoad = ({ params }) => {
  const randomId = Math.floor((Math.random() * articles.length - 1));
  const article = articles.find((article) => article.id === params.id) ?? articles[randomId];
  return {
    ...article,
    body: sanitize(marked.parse(article.body)),
    bodyEn: sanitize(marked.parse(article.bodyEn)),
  };
};