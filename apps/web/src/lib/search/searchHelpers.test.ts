import { expect, test } from "vitest";
import { availableSearchIndexes } from "./searchTypes";
import { mapIndexToMessage } from "./searchHelpers";

test("cover all indexes in translations", () => {
  for (const index of availableSearchIndexes) {
    expect(
      mapIndexToMessage(index),
      `Index ${index} has no translation`,
    ).not.toBe("");
  }
  expect(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- testing purpose
    mapIndexToMessage("test" as any),
    `Index test has a translation`,
  ).toBe("");
});
