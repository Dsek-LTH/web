/**
 * Runs the typdiff WASM diff off the main thread: diffing a large document
 * blocks, so it must never run on the thread that handles typing.
 * Mirrors `typst.worker.ts`.
 */
import init, { typdiff_source } from "./generated/typdiff_wasm.js";
import wasmUrl from "./generated/typdiff_wasm_bg.wasm?url";

const ctx = globalThis as unknown as {
  addEventListener: (
    type: "message",
    cb: (event: MessageEvent) => void,
  ) => void;
  postMessage: (message: unknown) => void;
};

const ready = init({ module_or_path: wasmUrl });

type Request =
  | { id: number; kind: "init" }
  | { id: number; kind: "diff"; oldSource: string; newSource: string };

ctx.addEventListener("message", (event) => {
  const request = event.data as Request;
  if (request.kind === "init") {
    void ready.then(
      () => ctx.postMessage({ id: request.id }),
      (e: unknown) =>
        ctx.postMessage({
          id: request.id,
          error: e instanceof Error ? e.message : String(e),
        }),
    );
    return;
  }
  const { id, oldSource, newSource } = request;
  void ready.then(() => {
    try {
      ctx.postMessage({ id, result: typdiff_source(oldSource, newSource) });
    } catch (e) {
      ctx.postMessage({
        id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });
});
