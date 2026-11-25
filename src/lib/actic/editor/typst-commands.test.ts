import { expect, test } from "vitest";
import { listContinuation } from "./typst-commands";

test("Enter continues -/+ list items with the same marker", () => {
  expect(listContinuation("- äta")).toBe("\n- ");
  expect(listContinuation("+ lösa")).toBe("\n+ ");
  expect(listContinuation("  - indented")).toBe("\n  - ");
});

test("Enter never continues term lists or plain lines", () => {
  // `/ Term: …` is a Typst term list — no `/ ` sprouting on Enter.
  expect(listContinuation("/ Term: beskrivning")).toBeNull();
  expect(listContinuation("/")).toBeNull();
  expect(listContinuation("plain prose")).toBeNull();
});

test("an empty list item ends the list instead of sprouting markers", () => {
  expect(listContinuation("- ")).toBeNull();
  expect(listContinuation("+ ")).toBeNull();
  expect(listContinuation("-")).toBeNull();
});
