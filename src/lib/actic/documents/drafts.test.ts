import { beforeEach, expect, test, vi } from "vitest";
import { getDraft, listDrafts, saveDraft } from "./drafts";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
});

test("legacy drafts without kind normalize to write drafts", () => {
  localStorage.setItem(
    "actic.drafts",
    JSON.stringify([{ id: "legacy", title: "Old motion", type: "motion" }]),
  );
  expect(getDraft("legacy")).toMatchObject({
    kind: "write",
    id: "legacy",
    title: "Old motion",
  });
});

test("diff drafts round-trip and are listed alongside write drafts", () => {
  saveDraft({
    kind: "diff",
    id: "diff-1",
    updatedAt: 123,
    slug: "policy-for-val",
    title: "Policy för val",
    source: "= Val\n",
  });
  saveDraft({
    kind: "write",
    id: "write-1",
    updatedAt: 456,
    family: "deliberation",
    type: "motion",
    title: "",
    meeting: "",
    authors: [],
    lang: "sv",
    dateIso: "2026-11-11",
    body: "",
    leadIn: "",
    yrkanden: [],
  });
  expect(
    listDrafts()
      .map((d) => d.kind)
      .sort(),
  ).toEqual(["diff", "write"]);
  expect(getDraft("diff-1")).toMatchObject({
    slug: "policy-for-val",
    source: "= Val\n",
  });
});
