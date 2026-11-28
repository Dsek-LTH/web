import { layoutPages } from "./pageLayout";

/** A file made available to the compiler at a virtual path (e.g. a signature). */
export type TypstFile = { path: string; bytes: Uint8Array };

/**
 * The compiler *and* renderer run in a Web Worker (see `typst.worker.ts`) so
 * neither blocks typing; this side only parses the returned SVG into the
 * shadow DOM.
 */

let worker: Worker | undefined;
let nextId = 1;
const pending = new Map<
  number,
  { resolve: (result: Uint8Array | string) => void; reject: (e: Error) => void }
>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./typst.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.addEventListener("message", (event: MessageEvent) => {
    const { id, result, error } = event.data as {
      id: number;
      result?: Uint8Array | string;
      error?: string;
    };
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    if (error) entry.reject(new Error(error));
    else entry.resolve(result!);
  });
  return worker;
}

function request(
  source: string,
  files: TypstFile[],
  format: "vector" | "pdf",
): Promise<Uint8Array | string> {
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

/** The worker is not re-entrant; serialize render/export work on this side. */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/** Compile Typst source into a PDF. */
export function renderTypstToPdf(
  source: string,
  files: TypstFile[] = [],
): Promise<Uint8Array> {
  return enqueue(async () => {
    const result = await request(source, files, "pdf");
    return result as Uint8Array;
  });
}

export type Preview = {
  /** Compile `source` and render it into the preview DOM. Throws on error. */
  update: (source: string, files: TypstFile[]) => Promise<void>;
};

/**
 * A live preview: the worker compiles and renders to SVG (off the main
 * thread), and this side parses the SVG into the shadow root.
 */
export async function createPreview(
  root: ShadowRoot,
  css: string,
): Promise<Preview> {
  const style = document.createElement("style");
  style.textContent = css;
  root.append(style);

  function update(source: string, files: TypstFile[]): Promise<void> {
    return enqueue(async () => {
      const svg = (await request(source, files, "vector")) as string;
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
