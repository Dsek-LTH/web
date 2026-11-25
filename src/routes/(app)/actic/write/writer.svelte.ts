import { tick } from "svelte";
import { SvelteDate, SvelteURLSearchParams } from "svelte/reactivity";
import { page } from "$app/state";
import {
  buildDocumentSource,
  documentSlug,
  getDocumentType,
  getFamily,
  hasDocumentContent,
  validateDocument,
  type DocumentInput,
} from "$lib/actic/documents/dsek";
import {
  getDraft,
  saveDraft,
  type WriteDraft,
} from "$lib/actic/documents/drafts";
import {
  restoreSignature,
  signatureDataUrl,
  signatureFiles,
} from "$lib/actic/documents/signatures";
import {
  createPreview,
  renderTypstToPdf,
  type Preview,
} from "$lib/actic/typst/typst";
import {
  nextId,
  type AuthorRow,
  type YrkandeRow,
} from "$lib/actic/documents/fields";
import {
  parseTypstDiagnostics,
  type TypstDiagnostic,
} from "$lib/actic/editor/diagnostics";
import { instantRenderEffect } from "$lib/actic/editor/instant-render.svelte";
import { documentShortcutsEffect } from "$lib/actic/editor/shortcuts.svelte";
import { toast } from "$lib/stores/toast";
import * as m from "$paraglide/messages";

const PREVIEW_CSS = "svg{display:block;width:100%;height:auto}";

export function todayIso(): string {
  return new SvelteDate().toISOString().slice(0, 10);
}

export function parseIso(iso: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, mo, d] = iso.split("-").map(Number);
  const now = new SvelteDate();
  return {
    year: y || now.getFullYear(),
    month: mo || 1,
    day: d || 1,
  };
}

/**
 * The state and machinery shared by every family's write page: the common
 * fields, the guided/advanced source modes, the live preview, drafts and
 * downloads. Each family page owns its own fields and provides `input`
 * through a getter; everything else reads from that.
 */
export class Writer {
  // --- shared form state -----------------------------------------------------
  lang = $state<"sv" | "en">("sv");
  dateIso = $state(todayIso());
  body = $state("");
  leadIn = $state("");
  authors = $state<AuthorRow[]>([{ id: nextId("author"), name: "" }]);
  yrkanden = $state<YrkandeRow[]>([
    { id: nextId("yrk"), clause: "", description: "" },
  ]);

  // --- guided/advanced source modes ------------------------------------------
  advanced = $state(false);
  forked = $state(false);
  manualSource = $state("");

  // --- validation ------------------------------------------------------------
  touched = $state({
    title: false,
    meeting: false,
    committee: false,
    position: false,
    authors: false,
  });

  // --- live preview ----------------------------------------------------------
  previewHost = $state<HTMLElement | undefined>();
  scrollBox = $state<HTMLElement | undefined>();
  compiling = $state(false);
  /** Whether the preview compiles itself as the form changes. Off means
   * the preview only updates via the manual compile button. */
  autocompile = $state(true);
  error = $state("");
  /** The last compile's diagnostics, for the source editor's squiggles. */
  diagnostics = $state<TypstDiagnostic[]>([]);
  rendered = $state(false);

  // --- drafts & download -----------------------------------------------------
  downloading = $state(false);
  /** The form's signature when it was last saved or restored; `dirty` is the diff. */
  private savedForm = $state("");
  dirty = $derived(this.formSignature() !== this.savedForm);
  readonly draftId: string | null = page.url.searchParams.get("draft");
  /** The draft being edited: the `?draft=` one, or the first save's new id. */
  private currentDraftId: string | null = this.draftId;

  private readonly getInput: (writer: Writer) => DocumentInput;
  private readonly applyFamilyDraft: (draft: WriteDraft) => void;
  private readonly buildFamilyDraft: () => Partial<WriteDraft>;
  private draftLoaded = false;
  private previewPromise: Promise<Preview> | null = null;
  private previewRoot: ShadowRoot | null = null;

  constructor({
    getInput,
    applyFamilyDraft = () => undefined,
    buildFamilyDraft = () => ({}),
  }: {
    /**
     * Receives the writer itself, because the constructor (via the dirty
     * baseline) reads the input while the page's `writer` binding is still
     * initializing — a closure over the binding would be a TDZ error.
     */
    getInput: (writer: Writer) => DocumentInput;
    applyFamilyDraft?: (draft: WriteDraft) => void;
    buildFamilyDraft?: () => Partial<WriteDraft>;
  }) {
    this.getInput = getInput;
    this.applyFamilyDraft = applyFamilyDraft;
    this.buildFamilyDraft = buildFamilyDraft;
    // Dirty tracking diffs the form against this baseline, so programmatic
    // writes (like a draft restore) never mark it dirty.
    this.savedForm = this.formSignature();
  }

  // --- derivations -----------------------------------------------------------
  input = $derived.by(() => this.getInput(this));
  activeType = $derived.by(() =>
    this.input.family === "deliberation"
      ? getDocumentType(this.input.type)
      : getDocumentType(getFamily(this.input.family).typeIds[0]),
  );
  generatedSource = $derived(buildDocumentSource(this.input));
  /** What the preview compiles: the forked manual source in advanced mode. */
  source = $derived(
    this.advanced && this.forked ? this.manualSource : this.generatedSource,
  );
  files = $derived(signatureFiles(this.authors.map((a) => a.signature?.path)));
  missing = $derived(validateDocument(this.input));
  ready = $derived(this.missing.length === 0);
  hasContent = $derived(hasDocumentContent(this.input));
  isToday = $derived(this.dateIso === todayIso());
  authorsError = $derived(
    this.touched.authors && !this.authors.some((a) => a.name.trim())
      ? m.actic_missing_authors()
      : "",
  );

  /** The lang/date/body every family input shares. */
  commonInput() {
    return {
      lang: this.lang,
      date: this.isToday ? undefined : parseIso(this.dateIso),
      body: this.body,
    };
  }

  // --- guided/advanced source modes ------------------------------------------
  setAdvanced(value: boolean) {
    this.advanced = value;
    if (value && !this.forked) this.manualSource = this.generatedSource;
  }
  resetFork() {
    this.forked = false;
    this.manualSource = this.generatedSource;
  }

  // --- live preview ----------------------------------------------------------
  private formatError(e: unknown): string {
    const raw = e instanceof Error ? e.message : String(e);
    const messages = [...raw.matchAll(/message:\s*"((?:[^"\\]|\\.)*)"/g)].map(
      (match) => (match[1] ?? "").replace(/\\n/g, "\n").replace(/\\"/g, '"'),
    );
    return messages.length > 0 ? messages.join("\n") : raw;
  }

  private getPreview(): Promise<Preview> {
    if (!this.previewHost) return Promise.reject(new Error("no preview host"));
    const root =
      this.previewHost.shadowRoot ??
      this.previewHost.attachShadow({ mode: "open" });
    // The host element is torn down while required fields are missing (the
    // checklist replaces it), so a cached preview can point at a detached
    // shadow root — recreate it whenever the host changes.
    if (!this.previewPromise || this.previewRoot !== root) {
      this.previewRoot = root;
      this.previewPromise = createPreview(root, PREVIEW_CSS);
    }
    return this.previewPromise;
  }

  private async renderPreview(
    current: string,
    currentFiles: typeof this.files,
  ) {
    this.compiling = true;
    const scrollTop = this.scrollBox?.scrollTop ?? 0;
    try {
      const preview = await this.getPreview();
      await preview.update(current, currentFiles);
      this.error = "";
      this.diagnostics = [];
      this.rendered = true;
      await tick();
      if (this.scrollBox) this.scrollBox.scrollTop = scrollTop;
    } catch (e) {
      this.error = this.formatError(e);
      this.diagnostics = parseTypstDiagnostics(
        e instanceof Error ? e.message : String(e),
        current,
      );
    } finally {
      this.compiling = false;
    }
  }

  // The compiler runs in a worker, so it no longer blocks typing. The
  // preview follows the source with the shared instant-render behaviour.
  // (Run as an effect by the shell — see `runEffects`.)
  runEffects() {
    instantRenderEffect({
      // Empty source = the shared effect's no-op case; autocompile-off
      // feeds it so the preview only moves on manual compiles.
      source: () => (this.autocompile && this.ready ? this.source : ""),
      files: () => this.files,
      render: (source, files) => this.renderPreview(source, files),
    });

    // Load an existing draft (from `?draft=`) once, on the client after mount
    // so that SSR and hydration agree.
    $effect(() => {
      if (!this.draftId || this.draftLoaded) return;
      this.draftLoaded = true;
      const draft = getDraft(this.draftId);
      if (!draft || draft.kind !== "write") return;
      void (async () => {
        // Restore signature images before assigning the authors so the preview
        // (which reads them synchronously) picks them up on the first render.
        await Promise.all(
          (draft.signatures ?? []).map((s) =>
            restoreSignature(s.path, s.dataUrl),
          ),
        );
        // Don't clobber anything the user managed to type meanwhile.
        if (this.dirty) return;
        this.applyDraft(draft);
        // The restore isn't a user edit — rebase dirty tracking on it.
        this.savedForm = this.formSignature();
      })();
    });

    // Ctrl/Cmd+S saves the draft, Ctrl/Cmd+Shift+S downloads the PDF,
    // Ctrl/Cmd+Enter compiles manually (a no-op while autocompile is on).
    documentShortcutsEffect({
      save: () => this.saveDraftNow(),
      downloadPdf: () => void this.download(),
      compile: () => void this.compileNow(),
    });

    $effect(() => {
      const onBeforeUnload = (e: BeforeUnloadEvent) => {
        if (this.dirty && this.hasContent) {
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

  // --- drafts ----------------------------------------------------------------
  /** Manual compile — the preview bar's re-render button, only enabled
   * while autocompile is off and the required fields are filled (the
   * checklist replaces the preview host before that). */
  async compileNow(): Promise<void> {
    if (this.autocompile || !this.ready || !this.source) return;
    await this.renderPreview(this.source, this.files);
  }

  /** A serialized snapshot of every tracked field, for dirty tracking. */
  private formSignature(): string {
    return JSON.stringify([
      this.input,
      this.leadIn,
      this.yrkanden,
      this.authors,
    ]);
  }

  applyDraft(draft: WriteDraft) {
    this.authors = draft.authors.length
      ? draft.authors.map((author) => ({ ...author, id: nextId("author") }))
      : [{ id: nextId("author"), name: "" }];
    this.leadIn = draft.leadIn;
    this.yrkanden = draft.yrkanden.length
      ? draft.yrkanden.map((y) => ({ ...y, id: nextId("yrk") }))
      : [{ id: nextId("yrk"), clause: "", description: "" }];
    this.lang = draft.lang;
    this.dateIso = draft.dateIso;
    this.body = draft.body;
    this.applyFamilyDraft(draft);
  }

  private buildDraft(): WriteDraft {
    return {
      kind: "write",
      id: this.currentDraftId ?? crypto.randomUUID(),
      updatedAt: Date.now(),
      family: this.input.family,
      type: this.activeType.id,
      title: "",
      meeting: "",
      authors: this.authors.map((author) => ({ ...author })),
      lang: this.lang,
      dateIso: this.dateIso,
      body: this.body,
      leadIn: this.leadIn,
      yrkanden: this.yrkanden.map((y) => ({
        clause: y.clause,
        description: y.description,
      })),
      signatures: this.authors
        .map((author) => author.signature?.path)
        .filter((path): path is string => !!path)
        .map((path) => ({ path, dataUrl: signatureDataUrl(path) }))
        .filter((s): s is { path: string; dataUrl: string } => !!s.dataUrl),
      ...this.buildFamilyDraft(),
    };
  }

  saveDraftNow() {
    if (!this.hasContent) return;
    const draft = this.buildDraft();
    if (!saveDraft(draft)) {
      toast(m.actic_draft_save_error(), "error");
      return;
    }
    this.currentDraftId = draft.id;
    if (!this.draftId) {
      // Link the page to the saved draft so a reload keeps editing it.
      const params = new SvelteURLSearchParams(window.location.search);
      params.set("draft", draft.id);
      history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params}${window.location.hash}`,
      );
    }
    this.savedForm = this.formSignature();
    toast(m.actic_draft_saved(), "success");
  }

  // --- download --------------------------------------------------------------
  downloadSource() {
    const blob = new Blob([this.source], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${documentSlug(this.input)}.typ`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async download() {
    if (!this.ready) {
      this.touched = {
        ...this.touched,
        title: true,
        meeting: true,
        committee: true,
        position: true,
        authors: true,
      };
      return;
    }
    this.downloading = true;
    this.error = "";
    try {
      const pdf = await renderTypstToPdf(this.source, this.files);
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${documentSlug(this.input)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      this.error = this.formatError(e);
    } finally {
      this.downloading = false;
    }
  }
}
