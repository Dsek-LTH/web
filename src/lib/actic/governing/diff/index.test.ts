import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, expect, test, vi } from "vitest";
import { buildDiff, initTypdiff } from "./index";

beforeAll(async () => {
  const bytes = readFileSync(
    fileURLToPath(new URL("./generated/typdiff_wasm_bg.wasm", import.meta.url)),
  );
  await initTypdiff(new WebAssembly.Module(bytes));
});

test("buildDiff wraps additions and deletions", async () => {
  // Pins the async signature: the diff runs in a worker, so callers await it.
  expect(buildDiff("a", "b")).toBeInstanceOf(Promise);
  const out = await buildDiff(
    "= Introduction\n\nThis is the old text.\n",
    "= Background\n\nThis is the new text.\n",
  );
  expect(out).toContain("#let diff-added(body)");
  expect(out).toContain("#diff-deleted[Introduction]");
  expect(out).toContain("#diff-added[Background]");
});

test("buildDiff of an unchanged document emits no diff markup", async () => {
  const source = "= Introduction\n\nThis is the text.\n";
  const out = await buildDiff(source, source);
  expect(out).toContain("= Introduction");
  expect(out).not.toContain("#diff-added[");
  expect(out).not.toContain("#diff-deleted[");
});

class FailingWorker {
  static latest: FailingWorker | undefined;
  private listeners = new Map<string, Set<(e: Event) => void>>();
  constructor() {
    FailingWorker.latest = this;
  }
  addEventListener(type: string, cb: (e: Event) => void) {
    this.listeners.set(type, (this.listeners.get(type) ?? new Set()).add(cb));
  }
  postMessage() {
    // The init request is posted; the worker never answers it.
  }
  /** Simulate the worker failing to load. */
  fail() {
    for (const cb of this.listeners.get("error") ?? []) cb(new Event("error"));
  }
}

test("a failed worker load rejects init — and the client retries on a fresh worker", async () => {
  vi.resetModules();
  vi.stubGlobal("Worker", FailingWorker);
  // Fresh module instance: the worker path, not the injected-module one.
  const { initTypdiff: freshInit } = await import("./index");

  // A worker that never loads must reject, not hang the page forever.
  const first = freshInit();
  FailingWorker.latest!.fail();
  await expect(first).rejects.toThrow("typdiff worker failed");

  // The failure reset the client: the next attempt builds a brand-new
  // worker and posts a new init — which fails again here, and that
  // rejection is exactly what a retryable client must produce.
  const firstWorker = FailingWorker.latest;
  const retry = freshInit();
  expect(FailingWorker.latest).not.toBe(firstWorker);
  FailingWorker.latest!.fail();
  await expect(retry).rejects.toThrow("typdiff worker failed");
});
