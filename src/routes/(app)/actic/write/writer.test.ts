import { beforeEach, expect, test, vi } from "vitest";

vi.mock("$app/state", () => ({
  page: {
    url: new URL("http://localhost:5173/actic/write/plan-of-operations"),
  },
}));
vi.mock("$lib/stores/toast", () => ({ toast: vi.fn() }));
vi.mock("$lib/actic/typst/typst", () => ({
  createPreview: vi.fn(),
  renderTypstToPdf: vi.fn(),
}));

import { Writer } from "./writer.svelte";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  });
});

test("manual compile only runs when autocompile is off", () => {
  const writer = new Writer({
    getInput: () => ({
      family: "plan-of-operations",
      lang: "sv",
      body: "= Verksamhetsplan\n",
      year: 2026,
    }),
  });

  // Autocompile is on by default: the preview compiles itself, and the
  // manual compile button is a no-op (it renders greyed out in the bar).
  void writer.compileNow();
  expect(writer.compiling).toBe(false);

  writer.autocompile = false;
  void writer.compileNow();
  expect(writer.compiling).toBe(true); // render started synchronously
});

test("compile now does nothing while required fields are missing", () => {
  // Deliberation requires title, meeting and authors — all empty here, so
  // the checklist shows and the preview host doesn't exist.
  const writer = new Writer({
    getInput: () => ({
      family: "deliberation",
      type: "motion",
      lang: "sv",
      title: "",
      meeting: "",
      body: "",
      authors: [],
      yrkanden: { leadIn: "", items: [{ id: "y1", clause: "" }] },
    }),
  });
  expect(writer.ready).toBe(false);

  writer.autocompile = false;
  void writer.compileNow();
  // The checklist replaces the preview host in this state — compiling would
  // only surface the internal "no preview host" error.
  expect(writer.compiling).toBe(false);
  expect(writer.error).toBe("");
});
