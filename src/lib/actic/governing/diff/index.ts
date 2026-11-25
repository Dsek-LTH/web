import init, { initSync, typdiff_source } from "./generated/typdiff_wasm.js";
import wasmUrl from "./generated/typdiff_wasm_bg.wasm?url";

let ready = false;
let initializing: Promise<void> | null = null;

/** Initialize the diff engine. Tests pass a compiled module instead of a URL. */
export async function initTypdiff(module?: WebAssembly.Module): Promise<void> {
  if (ready) return;
  if (module) {
    initSync({ module });
    ready = true;
    return;
  }
  initializing ??= init({ module_or_path: wasmUrl })
    .then(() => {
      ready = true;
    })
    .catch((error) => {
      // Forget the failed attempt so the next call retries.
      initializing = null;
      throw error;
    });
  await initializing;
}

/** Synchronous after `initTypdiff` resolves. Returns typdiff's generated source. */
export function buildDiff(oldSource: string, newSource: string): string {
  if (!ready) throw new Error("typdiff is not initialized");
  return typdiff_source(oldSource, newSource);
}
