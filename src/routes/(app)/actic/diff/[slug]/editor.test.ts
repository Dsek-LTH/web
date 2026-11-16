import { beforeEach, expect, test, vi } from "vitest";

vi.mock("$lib/stores/toast", () => ({ toast: vi.fn() }));
vi.mock("$lib/actic/typst", () => ({
  createPreview: vi.fn(),
  renderTypstToPdf: vi.fn(),
}));
vi.mock("$lib/actic/governing/diff", () => ({
  initTypdiff: vi.fn(),
  buildDiff: vi.fn(),
}));

import { listDrafts } from "$lib/actic/documents/drafts";
import { DiffSession } from "./editor.svelte";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
});

test("saving a new diff draft twice updates the same draft", () => {
  const session = new DiffSession({
    slug: "policy-for-val",
    title: "Policy för val",
    upstreamSource: "= Old\n",
    assets: [],
    draft: null,
  });

  session.source = "= New\n";
  session.saveDraftNow();
  session.source = "= Newer\n";
  session.saveDraftNow();

  const drafts = listDrafts();
  expect(drafts).toHaveLength(1);
  expect(drafts[0]).toMatchObject({
    kind: "diff",
    slug: "policy-for-val",
    source: "= Newer\n",
  });
});
