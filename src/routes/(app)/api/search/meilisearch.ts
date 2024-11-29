import { Meilisearch } from "meilisearch";
import { env } from "$env/dynamic/private";

export const meilisearch = new Meilisearch({
  host: env.MEILISEARCH_HOST,
  apiKey: env.MEILISEARCH_MASTER_KEY,
  requestConfig: {
    headers: {
      Authorization: `Bearer ${env.MEILISEARCH_MASTER_KEY}`,
    },
  },
});

await Promise.all([
  meilisearch.createIndex("positions"),
  meilisearch.createIndex("members"),
  meilisearch.createIndex("songs"),
  meilisearch.createIndex("articles"),
  meilisearch.createIndex("events"),
]);
