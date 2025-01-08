import { expect, test } from "vitest";
import {
  attributesUsedAsLink,
  availableSearchIndexes,
  listOfattributesUsedAsLink,
} from "./searchTypes";

/**
 * Test that all indexes has a link attribute
 * To reduce data sent to client during search
 * we slice some attributes from the search result
 * This test makes sure that we don't slice attributes
 * that are used as links.
 * All indexes should have at least one such attribute
 */
test("all indexes has attribute that doesn't get sliced", () => {
  for (const index of availableSearchIndexes) {
    const indexAttributes = attributesUsedAsLink[index];
    expect(
      indexAttributes,
      `Index "${index}" has no attributes that doesn't get sliced`,
    ).not.toBeUndefined();
    expect(Array.isArray(indexAttributes)).toBe(true);
    expect(indexAttributes.length > 0).toBe(true);
  }
  expect(listOfattributesUsedAsLink.length).toBeGreaterThanOrEqual(
    availableSearchIndexes.length,
  );
});
