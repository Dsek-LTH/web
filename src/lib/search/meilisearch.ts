import { Meilisearch } from "meilisearch";
import { env } from "$env/dynamic/private";

let meilisearch: Meilisearch | undefined;

export const getMeilisearch = (): Meilisearch => {
  if (!meilisearch) {
    const host = env.MEILISEARCH_HOST;
    const apiKey = env.MEILISEARCH_MASTER_KEY;
    if (!host) {
      throw new Error("Missing MEILISEARCH_HOST environment variable");
    }
    if (!apiKey) {
      throw new Error("Missing MEILISEARCH_MASTER_KEY environment variable");
    }

    meilisearch = new Meilisearch({ host, apiKey });
  }

  return meilisearch;
};
