import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, expect, test } from "vitest";
import { buildDiff, initTypdiff } from "./index";

beforeAll(async () => {
  const bytes = readFileSync(
    fileURLToPath(new URL("./generated/typdiff_wasm_bg.wasm", import.meta.url)),
  );
  await initTypdiff(new WebAssembly.Module(bytes));
});

test("buildDiff wraps additions and deletions", () => {
  const out = buildDiff(
    "= Introduction\n\nThis is the old text.\n",
    "= Background\n\nThis is the new text.\n",
  );
  expect(out).toContain("#let diff-added(body)");
  expect(out).toContain("#diff-deleted[Introduction]");
  expect(out).toContain("#diff-added[Background]");
});

test("buildDiff of an unchanged document emits no diff markup", () => {
  const source = "= Introduction\n\nThis is the text.\n";
  const out = buildDiff(source, source);
  expect(out).toContain("= Introduction");
  expect(out).not.toContain("#diff-added[");
  expect(out).not.toContain("#diff-deleted[");
});
