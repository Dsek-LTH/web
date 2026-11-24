import { tick } from "svelte";
import { buildDiff, initTypdiff } from "$lib/actic/governing/diff";
import {
  createPreview,
  renderTypstToPdf,
  type Preview,
  type TypstFile,
} from "$lib/actic/typst/typst";
import { saveDraft, type DiffDraft } from "$lib/actic/documents/drafts";
import { instantRenderEffect } from "$lib/actic/editor/instant-render.svelte";
import { documentShortcutsEffect } from "$lib/actic/editor/shortcuts.svelte";
import {
  parseTypstDiagnostics,
  type TypstDiagnostic,
} from "$lib/actic/editor/diagnostics";
import { toast } from "$lib/stores/toast";
import * as m from "$paraglide/messages";

const PREVIEW_CSS = "svg{display:block;width:100%;height:auto}";

function formatError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const messages = [...raw.matchAll(/message:\s*"((?:[^"\\]|\\.)*)"/g)].map(
    (match) => (match[1] ?? "").replace(/\\n/g, "\n").replace(/\\"/g, '"'),
  );
  return messages.length > 0 ? messages.join("\n") : raw;
}

export type DiffSessionOptions = {
  slug: string;
  title: string;
  upstreamSource: string | null;
  assets: Array<{ path: string; base64: string }>;
  draft: DiffDraft | null;
};

/**
 * The state and machinery for editing one governing document: the raw source,
 * the updated/diff preview tabs, drafts and downloads.
 */
export class DiffSession {
  source = $state("");
  /** Whether the preview shows the automatic diff against the upstream
   * document. Forced off while manual diff markers are in the source, where
   * the source itself renders as the diff. */
  autodiff = $state(true);
  previewHost = $state<HTMLElement | undefined>();
  scrollBox = $state<HTMLElement | undefined>();
  compiling = $state(false);
  rendered = $state(false);
  downloading = $state(false);
  diffReady = $state(false);
  error = $state("");
  /** The last compile's diagnostics, for the source editor's squiggles. */
  diagnostics = $state<TypstDiagnostic[]>([]);
  diffError = $state("");
  /** The latest diff of `upstreamSource` against `source`, filled by the
   * per-keystroke worker round-trip (see `runEffects`). */
  diffResult = $state<{ source: string; error: string }>({
    source: "",
    error: "",
  });

  private savedSource = $state("");
  private readonly upstreamSource = $state<string | null>(null);
  private draftId: string | null;
  private readonly slug: string;
  private readonly title: string;
  private readonly files: TypstFile[];
  private previewPromise: Promise<Preview> | null = null;
  private previewRoot: ShadowRoot | null = null;
  /** Monotonic counter for diff requests; any reply from an older one is stale. */
  private diffSeq = 0;
  /** Serializes diff requests; turns superseded before they start become no-ops. */
  private diffChain: Promise<void> = Promise.resolve();
  /** The source `diffResult` was computed from, so downloads can flush. */
  private diffedSource = "";

  constructor({
    slug,
    title,
    upstreamSource,
    assets,
    draft,
  }: DiffSessionOptions) {
    this.slug = slug;
    this.title = title;
    this.upstreamSource = upstreamSource;
    this.files = assets.map(({ path, base64 }) => ({
      path,
      bytes: Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
    }));
    this.draftId = draft?.id ?? null;
    const initial = draft?.source ?? upstreamSource ?? "";
    this.source = initial;
    this.savedSource = initial;
  }

  dirty = $derived(this.source !== this.savedSource);
  canReset = $derived(this.upstreamSource !== null);
  diffAvailable = $derived(this.upstreamSource !== null && this.diffReady);
  /**
   * Manual diff markers (`#diff-added[`/`#diff-deleted[` or their `#add[`/
   * `#remove[` aliases) make the automatic diff meaningless — and, being
   * part of the source, they keep autodiff off across reloads and drafts
   * without extra persisted state.
   */
  hasManualDiffMarkers = $derived(
    /#(?:diff-added|diff-deleted|add|remove)\[/.test(this.source),
  );
  canAutodiff = $derived(!this.hasManualDiffMarkers);
  /** What the preview compiles and the PDF downloads. Autodiff mode shows
   * the diff as soon as it exists — and *nothing* before that: falling back
   * to the raw source while the diff engine initialises would flash
   * undiffed content. Manual markers and autodiff-off show the source. */
  activeSource = $derived(
    this.autodiff && this.upstreamSource !== null && !this.hasManualDiffMarkers
      ? this.diffResult.source
      : this.source,
  );

  runEffects() {
    $effect(() => {
      void initTypdiff()
        .then(() => (this.diffReady = true))
        .catch((e) => (this.diffError = formatError(e)));
    });

    // Manual diff markers switch the preview into manual diffing mode: the
    // markers make the automatic diff meaningless, so autodiff turns itself
    // off (covers typed, pasted and draft-loaded markers alike).
    $effect(() => {
      if (this.hasManualDiffMarkers) this.autodiff = false;
    });

    // Diff on every keystroke: the worker runs off the main thread, so a
    // full-document WASM diff per character costs nothing but worker time —
    // requests coalesce on the chain (see `refreshDiff`) and the preview
    // follows the newest reply. In manual mode there is nothing to diff.
    $effect(() => {
      if (!this.diffAvailable || !this.autodiff) return;
      void this.source; // track
      void this.refreshDiff();
    });

    // The compiler runs in a worker; the preview follows `activeSource` with
    // exactly the `/write` instant-render behaviour.
    instantRenderEffect({
      source: () => this.activeSource,
      render: (source) => this.renderPreview(source),
    });

    // Ctrl/Cmd+S saves the draft, Ctrl/Cmd+Shift+S downloads the PDF.
    documentShortcutsEffect({
      save: () => this.saveDraftNow(),
      downloadPdf: () => void this.downloadPdf(),
    });

    $effect(() => {
      const onBeforeUnload = (e: BeforeUnloadEvent) => {
        if (this.dirty) {
          // returnValue covers browsers where preventDefault alone isn't
          // honoured (per MDN's recommended pattern).
          e.preventDefault();
          e.returnValue = true;
        }
      };
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    });
  }

  /** Diff `upstreamSource` against the current source now — called per
   * keystroke by the effect below, and by the download flush. Requests
   * serialize on a chain; a turn superseded by a newer one before it starts
   * becomes a no-op, and the newest request's reply is the only one that
   * lands (`diffSeq`), so out-of-order replies can't overwrite the newest
   * result and a typing burst can't back the worker up. */
  refreshDiff(): Promise<void> {
    if (!this.diffAvailable) return Promise.resolve();
    const seq = ++this.diffSeq;
    const source = this.source;
    const run = this.diffChain.then(() => {
      if (seq !== this.diffSeq) return;
      return this.runDiff(source, seq);
    });
    this.diffChain = run;
    return run;
  }

  private async runDiff(source: string, seq: number): Promise<void> {
    try {
      const result = await buildDiff(this.upstreamSource!, source);
      if (seq !== this.diffSeq) return;
      this.diffResult = { source: result, error: "" };
      this.diffedSource = source;
    } catch (e) {
      if (seq !== this.diffSeq) return;
      this.diffResult = { source: "", error: formatError(e) };
      this.diffedSource = source;
    }
  }

  /** Resolves once a diff of the newest source has completed, so downloads
   * never ship a keystroke-stale diff. No-op in manual mode — the preview
   * compiles the source itself and no diff is wanted. Converges once
   * typing pauses. */
  private async flushDiff(): Promise<void> {
    if (!this.diffAvailable || !this.autodiff) return;
    while (this.diffedSource !== this.source) {
      await this.refreshDiff();
    }
  }

  private getPreview(): Promise<Preview> {
    if (!this.previewHost) return Promise.reject(new Error("no preview host"));
    const root =
      this.previewHost.shadowRoot ??
      this.previewHost.attachShadow({ mode: "open" });
    if (!this.previewPromise || this.previewRoot !== root) {
      this.previewRoot = root;
      this.previewPromise = createPreview(root, PREVIEW_CSS);
    }
    return this.previewPromise;
  }

  private async renderPreview(current: string) {
    this.compiling = true;
    const scrollTop = this.scrollBox?.scrollTop ?? 0;
    try {
      const preview = await this.getPreview();
      await preview.update(current, this.files);
      this.error = "";
      this.diagnostics = [];
      this.rendered = true;
      await tick();
      if (this.scrollBox) this.scrollBox.scrollTop = scrollTop;
    } catch (e) {
      this.error = formatError(e);
      this.diagnostics = parseTypstDiagnostics(
        e instanceof Error ? e.message : String(e),
        current,
      );
    } finally {
      this.compiling = false;
    }
  }

  saveDraftNow() {
    if (!this.dirty || !this.source.trim()) return;
    const id = this.draftId ?? crypto.randomUUID();
    const draft: DiffDraft = {
      kind: "diff",
      id,
      updatedAt: Date.now(),
      slug: this.slug,
      title: this.title,
      source: this.source,
    };
    if (!saveDraft(draft)) {
      toast(m.actic_draft_save_error(), "error");
      return;
    }
    this.draftId = id;
    this.savedSource = this.source;
    toast(m.actic_draft_saved(), "success");
  }

  /** Discard the edits and return to the upstream document, on confirmation. */
  reset() {
    if (this.upstreamSource === null) return;
    if (!window.confirm(m.actic_diff_reset_confirm())) return;
    this.source = this.upstreamSource;
    this.savedSource = this.source;
  }

  /** Download the raw source as it stands. */
  downloadSource() {
    this.downloadAs(this.source, `${this.slug}.typ`);
  }

  /** Download typdiff's generated diff source (autodiff only). */
  async downloadDiffSource() {
    if (!this.diffAvailable) return;
    await this.flushDiff();
    if (!this.diffResult.source) return;
    this.downloadAs(this.diffResult.source, `${this.slug}-diff.typ`);
  }

  private downloadAs(source: string, filename: string) {
    const blob = new Blob([source], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async downloadPdf() {
    this.downloading = true;
    this.error = "";
    try {
      // Wait out the debounce so the PDF reflects the newest source.
      await this.flushDiff();
      if (!this.activeSource) return;
      const pdf = await renderTypstToPdf(this.activeSource, this.files);
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      // Both the computed diff and the manual-marker rendering are diff
      // presentations of the document, so they get the `-diff` suffix.
      const isDiffRender =
        this.hasManualDiffMarkers || (this.autodiff && this.diffAvailable);
      link.href = url;
      link.download = `${this.slug}${isDiffRender ? "-diff" : ""}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      this.error = formatError(e);
    } finally {
      this.downloading = false;
    }
  }
}
