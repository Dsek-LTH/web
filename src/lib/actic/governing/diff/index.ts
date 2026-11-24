import { initSync, typdiff_source } from "./generated/typdiff_wasm.js";

let ready = false;
/** True when a compiled module was injected (tests): the WASM runs here instead of in the worker. */
let mainThread = false;
let initialising: Promise<void> | null = null;

/**
 * Initialise the diff engine. Tests pass a compiled module to run the WASM on
 * the main thread instead of in the worker.
 */
export async function initTypdiff(module?: WebAssembly.Module): Promise<void> {
  if (ready) return;
  if (module) {
    initSync({ module });
    ready = true;
    mainThread = true;
    return;
  }
  initialising ??= getWorkerReady().catch((error) => {
    // Forget the failed attempt so the next call retries.
    initialising = null;
    throw error;
  });
  await initialising;
}

// --- diff worker client (same pattern as `typst.ts`) ------------------------

type Pending = {
  resolve: (result: string) => void;
  reject: (e: Error) => void;
};

let worker: Worker | undefined;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./typdiff.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.addEventListener("message", (event: MessageEvent) => {
    const { id, result, error } = event.data as {
      id: number;
      result?: string;
      error?: string;
    };
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    if (error) entry.reject(new Error(error));
    else entry.resolve(result ?? "");
  });
  return worker;
}

function getWorkerReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve: () => resolve(), reject });
    getWorker().postMessage({ id, kind: "init" });
  });
}

/**
 * Diff two Typst sources; resolves with typdiff's generated source. The WASM
 * runs in a worker, so a full-document diff never blocks the main thread
 * (tests that injected a module get the synchronous path, still awaited).
 */
export async function buildDiff(
  oldSource: string,
  newSource: string,
): Promise<string> {
  if (mainThread) {
    if (!ready) throw new Error("typdiff is not initialized");
    return typdiff_source(oldSource, newSource);
  }
  await initTypdiff();
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, kind: "diff", oldSource, newSource });
  });
}
