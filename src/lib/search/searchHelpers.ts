import { availableSearchIndexes } from "./searchTypes";

export type SearchIndex =
  (typeof availableSearchIndexes)[keyof typeof availableSearchIndexes];

export function getFederatedWeight(index: string): number {
  switch (index) {
    case availableSearchIndexes.members:
      return 5;
    case availableSearchIndexes.events:
      return 1;
    case availableSearchIndexes.articles:
      return 1;
    case availableSearchIndexes.positions:
      return 5;
    case availableSearchIndexes.songs:
      return 1;
    default:
      return 1;
  }
}
