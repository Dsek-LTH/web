/**
 * Runs the Typst *compiler* off the main thread.
 *
 * Compiling blocks its thread (WASM), so a large document would freeze typing.
 * The worker owns the compiler; the main thread only renders the resulting
 * vector artifact (which is cheap) and touches the DOM.
 */
import { $typst, loadFonts } from "@myriaddreamin/typst.ts";
import { CompileFormatEnum } from "@myriaddreamin/typst.ts/compiler";
import compilerWasmUrl from "@myriaddreamin/typst-ts-web-compiler/wasm?url";

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
$typst.use({
  key: "actic-fonts",
  forRoles: ["compiler"],
  provides: [loadFonts(FONT_URLS)],
});
const compilerPromise = $typst.getCompiler();

type Request = {
  id: number;
  source: string;
  files: Array<{ path: string; bytes: Uint8Array }>;
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
    ctx.postMessage({ id, result }, [result.buffer]);
  } catch (e) {
    ctx.postMessage({
      id,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
