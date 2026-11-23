import { tick } from "svelte";
import { buildDiff, initTypdiff } from "$lib/actic/governing/diff";
import {
  createPreview,
  renderTypstToPdf,
  type Preview,
  type TypstFile,
} from "$lib/actic/typst/typst";
import { saveDraft, type DiffDraft } from "$lib/actic/documents/drafts";
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

  private savedSource = $state("");
  private readonly upstreamSource = $state<string | null>(null);
  private draftId: string | null;
  private readonly slug: string;
  private readonly title: string;
  private readonly files: TypstFile[];
  private inFlight = false;
  private queued: string | null = null;
  private lastRenderMs = 0;
  private previewPromise: Promise<Preview> | null = null;
  private previewRoot: ShadowRoot | null = null;

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
  diffResult = $derived.by(() => {
    if (!this.diffAvailable) return { source: "", error: "" };
    try {
      return {
        source: buildDiff(this.upstreamSource!, this.source),
        error: "",
      };
    } catch (e) {
      return { source: "", error: formatError(e) };
    }
  });
  activeSource = $derived(
    this.autodiff && this.diffAvailable && !this.hasManualDiffMarkers
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

    // The compiler runs in a worker; coalesce bursts so we don't queue a
    // backlog of compiles (same pattern as `Writer.runEffects`).
    $effect(() => {
      const current = this.activeSource;
      if (!current) return;
      const delay = this.lastRenderMs > 200 ? 120 : 0;
      const timer = setTimeout(() => {
        if (this.inFlight) {
          this.queued = current;
          return;
        }
        void this.renderPreview(current);
      }, delay);
      return () => clearTimeout(timer);
    });

    $effect(() => {
      const onKey = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          this.saveDraftNow();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    });

    $effect(() => {
      const onBeforeUnload = (e: BeforeUnloadEvent) => {
        if (this.dirty) e.preventDefault();
      };
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    });
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
    this.inFlight = true;
    this.compiling = true;
    const started = performance.now();
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
      this.lastRenderMs = performance.now() - started;
      this.inFlight = false;
      this.compiling = false;
      if (this.queued !== null) {
        const next = this.queued;
        this.queued = null;
        void this.renderPreview(next);
      }
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
  downloadDiffSource() {
    if (!this.diffAvailable || !this.diffResult.source) return;
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
    if (!this.activeSource) return;
    this.downloading = true;
    this.error = "";
    try {
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
