import { beforeEach, expect, test, vi } from "vitest";

vi.mock("$lib/stores/toast", () => ({ toast: vi.fn() }));
vi.mock("$lib/actic/typst/typst", () => ({
  createPreview: vi.fn(),
  renderTypstToPdf: vi.fn(),
}));
vi.mock("$lib/actic/governing/diff", () => ({
  initTypdiff: vi.fn(() => Promise.resolve()),
  buildDiff: vi.fn(() => Promise.resolve("")),
}));

import { listDrafts } from "$lib/actic/documents/drafts";
import { buildDiff } from "$lib/actic/governing/diff";
import { renderTypstToPdf } from "$lib/actic/typst/typst";
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

test("autodiff never falls back to the raw source before the first diff lands", () => {
  const session = new DiffSession({
    slug: "s",
    title: "t",
    upstreamSource: "= Old\n",
    assets: [],
    draft: null,
  });
  // While the diff engine is still initialising, autodiff mode shows nothing
  // — compiling the raw source here would flash undiffed content.
  expect(session.activeSource).toBe("");

  session.diffReady = true;
  session.diffResult = { source: "= diffed\n", error: "" };
  expect(session.activeSource).toBe("= diffed\n");

  // Manual diff markers and autodiff-off both fall back to the source itself.
  session.source = "#remove[x]\n";
  expect(session.activeSource).toBe("#remove[x]\n");
  session.autodiff = false;
  expect(session.activeSource).toBe("#remove[x]\n");
});

test("a diff request queued behind an in-flight one posts only when its turn comes", async () => {
  const resolvers: Array<(s: string) => void> = [];
  vi.mocked(buildDiff).mockImplementation(
    () => new Promise((r) => resolvers.push(r)),
  );
  const session = new DiffSession({
    slug: "s",
    title: "t",
    upstreamSource: "= Old\n",
    assets: [],
    draft: null,
  });
  session.diffReady = true;

  session.source = "= A\n";
  const first = session.refreshDiff();
  await Promise.resolve(); // the request chain posts on its first turn
  expect(resolvers).toHaveLength(1); // idle worker: posts immediately
  session.source = "= B\n";
  const second = session.refreshDiff();
  expect(resolvers).toHaveLength(1); // coalesced: waits for the in-flight one

  resolvers[0]!("= diffed A\n"); // superseded source's reply...
  await first;
  expect(session.diffResult.source).toBe(""); // ...is dropped
  expect(resolvers).toHaveLength(2); // and only now does B's diff post
  resolvers[1]!("= diffed B\n");
  await second;
  expect(session.diffResult.source).toBe("= diffed B\n");
});

test("downloads skip the diff entirely when autodiff is off", async () => {
  const click = vi.fn();
  vi.stubGlobal("document", { createElement: vi.fn(() => ({ click })) });
  Object.assign(URL, {
    createObjectURL: vi.fn(() => "blob:x"),
    revokeObjectURL: vi.fn(),
  });
  vi.mocked(renderTypstToPdf).mockResolvedValue(new Uint8Array());
  const session = new DiffSession({
    slug: "s",
    title: "t",
    upstreamSource: "= Old\n",
    assets: [],
    draft: null,
  });
  session.diffReady = true;
  session.autodiff = false;
  session.source = "= Edited\n";

  await session.downloadPdf();

  expect(buildDiff).not.toHaveBeenCalled();
  expect(renderTypstToPdf).toHaveBeenCalledWith("= Edited\n", []);
  expect(click).toHaveBeenCalled();
});

test("manual compile only runs when autocompile is off", () => {
  const session = new DiffSession({
    slug: "s",
    title: "t",
    upstreamSource: "= Old\n",
    assets: [],
    draft: null,
  });
  session.diffReady = true;
  session.autodiff = false;
  session.source = "= Edited\n";

  // Autocompile is on by default: the preview compiles itself, and the
  // manual compile button is a no-op (it renders greyed out in the bar).
  void session.compileNow();
  expect(session.compiling).toBe(false);

  session.autocompile = false;
  void session.compileNow();
  expect(session.compiling).toBe(true); // render started synchronously
});

test("downloads wait for a diff of the newest source", async () => {
  let resolveDiff!: (s: string) => void;
  vi.mocked(buildDiff).mockImplementation(
    () => new Promise((r) => (resolveDiff = r)),
  );
  const click = vi.fn();
  vi.stubGlobal("document", { createElement: vi.fn(() => ({ click })) });
  Object.assign(URL, {
    createObjectURL: vi.fn(() => "blob:x"),
    revokeObjectURL: vi.fn(),
  });
  const session = new DiffSession({
    slug: "s",
    title: "t",
    upstreamSource: "= Old\n",
    assets: [],
    draft: null,
  });
  session.diffReady = true;
  session.source = "= New\n";

  const download = session.downloadDiffSource();
  // The flush kicks the diff off immediately; the download only completes
  // once a diff of the newest source has resolved.
  await Promise.resolve(); // the request chain posts on its first turn
  expect(buildDiff).toHaveBeenCalledTimes(1);
  expect(click).not.toHaveBeenCalled();
  resolveDiff("= diffed\n");
  await download;
  expect(buildDiff).toHaveBeenCalledWith("= Old\n", "= New\n");
  expect(click).toHaveBeenCalled();
});
