/**
 * Runs the Typst *compiler and renderer* off the main thread.
 *
 * Both block their thread (WASM), so a large document would freeze typing:
 * compiling renders a vector artifact, and rendering that artifact to SVG
 * costs real time on multi-page documents — neither may run while typing.
 * The worker owns both; the main thread only parses the returned SVG into
 * the shadow DOM.
 */
// NOTE: `@myriaddreamin/typst.ts` is pinned to 0.8.0-rc3 (Typst 0.15) because
// `@preview/dsek:0.1.0`'s `nomination-proposal` calls `Dict::map`, which was
// added in Typst 0.15. On 0.7.0 (Typst 0.13) nomination documents fail to
// compile ("type dictionary has no method `map`").
import { $typst, loadFonts } from "@myriaddreamin/typst.ts";
import { CompileFormatEnum } from "@myriaddreamin/typst.ts/compiler";
import compilerWasmUrl from "@myriaddreamin/typst-ts-web-compiler/wasm?url";
import rendererWasmUrl from "@myriaddreamin/typst-ts-renderer/wasm?url";

const FONT_URLS = [
  "/fonts/Domitian.otc",
  "/fonts/texgyreheros.otc",
  "/fonts/lthsymbols.otf",
];

const ctx = globalThis as unknown as {
  addEventListener: (type: string, cb: (event: MessageEvent) => void) => void;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

$typst.setCompilerInitOptions({ getModule: () => compilerWasmUrl });
$typst.setRendererInitOptions({ getModule: () => rendererWasmUrl });
$typst.use({
  key: "actic-fonts",
  forRoles: ["compiler"],
  provides: [loadFonts(FONT_URLS)],
});
const compilerPromise = $typst.getCompiler();
const rendererPromise = $typst.getRenderer();

type Request = {
  id: number;
  source: string;
  files: Array<{ path: string; bytes: Uint8Array }>;
  /** `"vector"` compiles + renders to an SVG string; `"pdf"` returns bytes. */
  format: "vector" | "pdf";
};

ctx.addEventListener("message", (event) => {
  void handle(event.data as Request);
});

async function handle({ id, source, files, format }: Request) {
  try {
    const compiler = await compilerPromise;
    compiler.resetShadow();
    for (const file of files) {
      compiler.mapShadow(file.path, new Uint8Array(file.bytes));
    }
    compiler.addSource("/main.typ", source);
    const { result, diagnostics } = await compiler.compile({
      mainFilePath: "/main.typ",
      format:
        format === "pdf" ? CompileFormatEnum.pdf : CompileFormatEnum.vector,
      diagnostics: "unix",
    });
    if (!result) {
      ctx.postMessage({
        id,
        error:
          (diagnostics as string[] | undefined)?.join("\n") ||
          "Compilation failed",
      });
      return;
    }
    if (format === "pdf") {
      ctx.postMessage({ id, result }, [result.buffer]);
      return;
    }
    const renderer = await rendererPromise;
    const svg = await renderer.renderSvg({
      format: "vector",
      artifactContent: result,
      // Drop the ~30KB interactive-script payload; it only bloats the DOM.
      data_selection: { body: true, defs: true, css: true, js: false },
    });
    ctx.postMessage({ id, result: svg });
  } catch (e) {
    ctx.postMessage({
      id,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
