import rendererWasmUrl from "@myriaddreamin/typst-ts-renderer/wasm?url";
import { layoutPages } from "./pageLayout";

/** A file made available to the compiler at a virtual path (e.g. a signature). */
export type TypstFile = { path: string; bytes: Uint8Array };

/**
 * Lazily initialize the Typst *renderer* on the main thread.
 *
 * The compiler runs in a Web Worker (see `typst.worker.ts`) so it never blocks
 * the UI; only the renderer (which is cheap) lives here. The `?url` import only
 * pulls in the `.wasm` asset, so it is safe during SSR.
 */
async function createTypst() {
  const { $typst } = await import("@myriaddreamin/typst.ts");
  $typst.setRendererInitOptions({ getModule: () => rendererWasmUrl });
  return $typst;
}

let typstPromise: ReturnType<typeof createTypst> | undefined;

function getTypst() {
  return (typstPromise ??= createTypst());
}

/** The compiler is not re-entrant; serialize render/export work on this side. */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

// --- compiler worker client ------------------------------------------------

type Pending = {
  resolve: (bytes: Uint8Array) => void;
  reject: (e: Error) => void;
};

let worker: Worker | undefined;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./typst.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.addEventListener("message", (event: MessageEvent) => {
    const { id, result, error } = event.data as {
      id: number;
      result?: Uint8Array;
      error?: string;
    };
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    if (error) entry.reject(new Error(error));
    else if (result) entry.resolve(result);
  });
  return worker;
}

function compile(
  source: string,
  files: TypstFile[],
  format: "vector" | "pdf",
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({
      id,
      source,
      files: files.map((file) => ({ path: file.path, bytes: file.bytes })),
      format,
    });
  });
}

/** Compile Typst source into a PDF. */
export function renderTypstToPdf(
  source: string,
  files: TypstFile[] = [],
): Promise<Uint8Array> {
  return enqueue(() => compile(source, files, "pdf"));
}

export type Preview = {
  /** Compile `source` and render it into the preview DOM. Throws on error. */
  update: (source: string, files: TypstFile[]) => Promise<void>;
};

/**
 * A live preview: the worker compiles (off the main thread), and this side
 * renders the artifact to SVG and swaps it into the shadow root.
 */
export async function createPreview(
  root: ShadowRoot,
  css: string,
): Promise<Preview> {
  const renderer = await (await getTypst()).getRenderer();

  const style = document.createElement("style");
  style.textContent = css;
  root.append(style);

  function update(source: string, files: TypstFile[]): Promise<void> {
    return enqueue(async () => {
      const artifact = await compile(source, files, "vector");
      const svg = await renderer.renderSvg({
        format: "vector",
        artifactContent: artifact,
        // Drop the ~30KB interactive-script payload; it only bloats the DOM.
        data_selection: { body: true, defs: true, css: true, js: false },
      });
      applySvg(root, svg);
    });
  }

  return { update };
}

function applySvg(root: ShadowRoot, svg: string) {
  const box = document.createElement("div");
  box.innerHTML = svg;
  const next = box.firstElementChild as SVGElement | null;
  if (!next) return;
  layoutPages(next);
  const prev = root.querySelector("svg");
  if (prev) prev.replaceWith(next);
  else root.append(next);
}
