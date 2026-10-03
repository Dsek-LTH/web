import compilerWasmUrl from "@myriaddreamin/typst-ts-web-compiler/wasm?url";
import rendererWasmUrl from "@myriaddreamin/typst-ts-renderer/wasm?url";

/**
 * Fonts required by the `dsek` Typst package, served from `static/fonts`.
 * Without these the compiler falls back to its default fonts and the documents
 * do not look the way the package intends.
 */
const FONT_URLS = [
  "/fonts/Domitian.otc",
  "/fonts/texgyreheros.otc",
  "/fonts/lthsymbols.otf",
];

/**
 * Lazily initialize the Typst compiler + renderer WASM modules.
 *
 * `@myriaddreamin/typst.ts` is imported dynamically so it is never evaluated
 * during SSR; this module is only ever called from the browser. The two `?url`
 * imports above only pull in the `.wasm` assets, so they are safe on the server.
 */
async function createTypst() {
  const { $typst, loadFonts } = await import("@myriaddreamin/typst.ts");
  $typst.setCompilerInitOptions({ getModule: () => compilerWasmUrl });
  $typst.setRendererInitOptions({ getModule: () => rendererWasmUrl });
  $typst.use({
    key: "actic-fonts",
    forRoles: ["compiler"],
    provides: [loadFonts(FONT_URLS)],
  });
  return $typst;
}

let typstPromise: ReturnType<typeof createTypst> | undefined;

function getTypst() {
  return (typstPromise ??= createTypst());
}

/**
 * The shared `$typst` instance keeps compile state, so never run two compiles
 * at once — e.g. a live preview render overlapping a PDF download.
 */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/**
 * Compile Typst source into a self-contained SVG string.
 *
 * `data_selection.js` is disabled: the interactive-script payload is ~30KB of
 * invalid-XML markup that we would only have to strip again, and it dominates
 * the cost of a re-render while typing.
 */
export function renderTypstToSvg(source: string): Promise<string> {
  return enqueue(async () =>
    (await getTypst()).svg({
      mainContent: source,
      data_selection: { body: true, defs: true, css: true, js: false },
    }),
  );
}

/** Compile Typst source into a PDF. */
export async function renderTypstToPdf(source: string): Promise<Uint8Array> {
  const pdf = await enqueue(async () =>
    (await getTypst()).pdf({ mainContent: source }),
  );
  if (!pdf) {
    throw new Error("Typst did not return a PDF");
  }
  return pdf;
}
