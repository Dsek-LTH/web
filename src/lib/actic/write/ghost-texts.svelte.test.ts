import { expect, test } from "vitest";
import { contentKeyedDealer, ghostDealer } from "./ghost-texts.svelte";

test("dealing hands out each ghost once before repeating", () => {
  const deal = ghostDealer(["a", "b", "c"]);
  const dealt = ["r1", "r2", "r3", "r4", "r5", "r6"].map(deal);
  // Each round of `pool.length` deals covers the whole pool exactly once —
  // no repeats until the deck is exhausted; the reshuffle may reorder.
  expect(new Set(dealt.slice(0, 3))).toEqual(new Set(["a", "b", "c"]));
  expect(new Set(dealt.slice(3, 6))).toEqual(new Set(["a", "b", "c"]));
});

test("a dealt row keeps its ghost while typing (same seed, same string)", () => {
  const deal = ghostDealer(["a", "b", "c"]);
  expect(deal("row-1")).toBe(deal("row-1"));
  expect(deal("row-1")).toBe(deal("row-1"));
});

test("a single-ghost pool is fixed — the old way for unnumbered keys", () => {
  const deal = ghostDealer(["välja in personerna ovan"]);
  expect(deal("r1")).toBe("välja in personerna ovan");
  expect(deal("r2")).toBe("välja in personerna ovan");
});

test("a pool's identity changing does not reshuffle — content does", () => {
  let pool = ["a", "b", "c"];
  const deal = contentKeyedDealer(() => pool);
  const firstRound = ["r1", "r2"].map(deal);
  // Same content, new array identity (what every parent re-render hands us):
  pool = ["a", "b", "c"];
  const secondRound = ["r3"].map(deal);
  // All three deals together still cover the pool exactly once.
  expect(new Set([...firstRound, ...secondRound])).toEqual(
    new Set(["a", "b", "c"]),
  );
});
