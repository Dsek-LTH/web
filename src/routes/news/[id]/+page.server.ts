import { articles } from '$lib/articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
  const randomId = Math.floor((Math.random() * articles.length - 1));
  const article = articles.find((article) => article.id === params.id) ?? articles[randomId];
  return article;
};