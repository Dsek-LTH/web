import { tick } from "svelte";
import { SvelteDate } from "svelte/reactivity";
import { page } from "$app/state";
import {
  buildDocumentSource,
  documentSlug,
  getDocumentType,
  getFamily,
  hasDocumentContent,
  validateDocument,
  type DocumentInput,
} from "$lib/actic/dsek";
import { getDraft, saveDraft, type Draft } from "$lib/actic/drafts";
import {
  restoreSignature,
  signatureDataUrl,
  signatureFiles,
} from "$lib/actic/signatures";
import { createPreview, renderTypstToPdf, type Preview } from "$lib/actic/typst";
import { nextId, type AuthorRow, type YrkandeRow } from "$lib/actic/fields";
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
  error = $state("");
  rendered = $state(false);

  // --- drafts & download -----------------------------------------------------
  downloading = $state(false);
  dirty = $state(false);
  readonly draftId: string | null = page.url.searchParams.get("draft");

  private readonly getInput: () => DocumentInput;
  private readonly applyFamilyDraft: (draft: Draft) => void;
  private readonly buildFamilyDraft: () => Partial<Draft>;
  private draftLoaded = false;
  private inFlight = false;
  private queued: string | null = null;
  private lastRenderMs = 0;
  private previewPromise: Promise<Preview> | null = null;
  private previewRoot: ShadowRoot | null = null;
  private skipFirstDirtyCheck = true;

  constructor({
    getInput,
    applyFamilyDraft = () => undefined,
    buildFamilyDraft = () => ({}),
  }: {
    getInput: () => DocumentInput;
    applyFamilyDraft?: (draft: Draft) => void;
    buildFamilyDraft?: () => Partial<Draft>;
  }) {
    this.getInput = getInput;
    this.applyFamilyDraft = applyFamilyDraft;
    this.buildFamilyDraft = buildFamilyDraft;
  }

  // --- derivations -----------------------------------------------------------
  input = $derived.by(() => this.getInput());
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
      this.previewHost.shadowRoot ?? this.previewHost.attachShadow({ mode: "open" });
    // The host element is torn down while required fields are missing (the
    // checklist replaces it), so a cached preview can point at a detached
    // shadow root — recreate it whenever the host changes.
    if (!this.previewPromise || this.previewRoot !== root) {
      this.previewRoot = root;
      this.previewPromise = createPreview(root, PREVIEW_CSS);
    }
    return this.previewPromise;
  }

  private async renderPreview(current: string, currentFiles: typeof this.files) {
    this.inFlight = true;
    this.compiling = true;
    const started = performance.now();
    const scrollTop = this.scrollBox?.scrollTop ?? 0;
    try {
      const preview = await this.getPreview();
      await preview.update(current, currentFiles);
      this.error = "";
      this.rendered = true;
      await tick();
      if (this.scrollBox) this.scrollBox.scrollTop = scrollTop;
    } catch (e) {
      this.error = this.formatError(e);
    } finally {
      this.lastRenderMs = performance.now() - started;
      this.inFlight = false;
      this.compiling = false;
      if (this.queued !== null) {
        const next = this.queued;
        this.queued = null;
        void this.renderPreview(next, this.files);
      }
    }
  }

  // The compiler runs in a worker, so it no longer blocks typing; still
  // coalesce bursts so we don't queue a backlog of compiles.
  // (Run as an effect by the shell — see `runEffects`.)
  runEffects() {
    $effect(() => {
      const current = this.ready ? this.source : "";
      void this.files; // track signatures too
      if (!current) return;
      const delay = this.lastRenderMs > 200 ? 120 : 0;
      const timer = setTimeout(() => {
        if (this.inFlight) {
          this.queued = current;
          return;
        }
        void this.renderPreview(current, this.files);
      }, delay);
      return () => clearTimeout(timer);
    });

    // Load an existing draft (from `?draft=`) once, on the client after mount
    // so that SSR and hydration agree.
    $effect(() => {
      if (!this.draftId || this.draftLoaded) return;
      this.draftLoaded = true;
      const draft = getDraft(this.draftId);
      if (!draft) return;
      void (async () => {
        // Restore signature images before assigning the authors so the preview
        // (which reads them synchronously) picks them up on the first render.
        await Promise.all(
          (draft.signatures ?? []).map((s) =>
            restoreSignature(s.path, s.dataUrl),
          ),
        );
        this.applyDraft(draft);
      })();
    });

    // Touch every field so any change marks the form dirty. Reading the input
    // covers the family fields too (through the page's getter).
    $effect(() => {
      void [this.input, this.leadIn, this.yrkanden, this.authors];
      if (this.skipFirstDirtyCheck) {
        this.skipFirstDirtyCheck = false;
        return;
      }
      this.dirty = true;
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
        if (this.dirty && this.hasContent) e.preventDefault();
      };
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    });
  }

  // --- drafts ----------------------------------------------------------------
  applyDraft(draft: Draft) {
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

  private buildDraft(): Draft {
    return {
      id: this.draftId ?? crypto.randomUUID(),
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

  // Load an existing draft (from `?draft=`) once, on the client after mount so
  // that SSR and hydration agree — see `runEffects`.

  saveDraftNow() {
    if (!this.hasContent) return;
    const draft = this.buildDraft();
    saveDraft(draft);
    this.dirty = false;
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
