<script lang="ts">
  import { tick } from "svelte";
  import { page } from "$app/state";
  import * as Tabs from "$lib/components/ui/tabs";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages";
  import Download from "@lucide/svelte/icons/download";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import Languages from "@lucide/svelte/icons/languages";
  import Save from "@lucide/svelte/icons/save";
  import FileCode from "@lucide/svelte/icons/file-code";
  import AuthorCard from "./AuthorCard.svelte";
  import TypstEditor from "$lib/actic/TypstEditor.svelte";
  import SortableItem from "$lib/actic/SortableItem.svelte";
  import { attachAction } from "$lib/actic/attachAction";
  import { DragDropProvider } from "@dnd-kit/svelte";
  import { move } from "@dnd-kit/helpers";
  import { toast } from "$lib/stores/toast";
  import {
    buildDocumentSource,
    DOCUMENT_TYPES,
    getDocumentType,
    slugify,
    type AuthorInput,
    type DocumentTypeId,
  } from "$lib/actic/dsek";
  import { signatureFiles } from "$lib/actic/signatures";
  import { getDraft, saveDraft } from "$lib/actic/drafts";
  import {
    createPreview,
    renderTypstToPdf,
    type Preview,
  } from "$lib/actic/typst";

  const PREVIEW_CSS = "svg{display:block;width:100%;height:auto}";

  type YrkandeRow = { id: string; clause: string; description: string };
  type AuthorRow = AuthorInput & { id: string };

  // Deterministic ids so SSR and hydration produce the same list keys.
  let rowSeq = 0;
  function nextRowId(): string {
    return `row-${rowSeq++}`;
  }

  function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
  function emptyAuthor(): AuthorRow {
    return { id: nextRowId(), name: "" };
  }
  function emptyYrkande(): YrkandeRow {
    return { id: nextRowId(), clause: "", description: "" };
  }

  // The document type is a per-draft field. The URL only carries the family
  // (`?type=deliberation`); the concrete type is handed off from the landing
  // page through sessionStorage and read once below.
  let documentType = $state<DocumentTypeId>("motion");
  let title = $state("");
  let meeting = $state("");
  let authors = $state<AuthorRow[]>([emptyAuthor()]);
  let lang = $state<"sv" | "en">("sv");
  let dateIso = $state(todayIso());
  let body = $state("");
  let leadIn = $state("");
  let yrkanden = $state<YrkandeRow[]>([emptyYrkande()]);
  let advanced = $state(false);
  let forked = $state(false);
  let manualSource = $state("");

  // Load an existing draft (from `?draft=`) once, on the client after mount so
  // that SSR and hydration agree.
  let draftId: string | null = page.url.searchParams.get("draft");
  let draftLoaded = false;
  $effect(() => {
    if (!draftId || draftLoaded) return;
    draftLoaded = true;
    const draft = getDraft(draftId);
    if (!draft) return;
    documentType = draft.type;
    title = draft.title;
    meeting = draft.meeting;
    authors = draft.authors.length
      ? draft.authors.map((author) => ({ ...author, id: nextRowId() }))
      : [emptyAuthor()];
    lang = draft.lang;
    dateIso = draft.dateIso;
    body = draft.body;
    leadIn = draft.leadIn;
    yrkanden = draft.yrkanden.length
      ? draft.yrkanden.map((y) => ({ ...y, id: nextRowId() }))
      : [emptyYrkande()];
  });

  // The landing page's "create" cards stash the chosen type in sessionStorage
  // (the URL is shared across types), so pick it up once on the client. Opening
  // an existing draft (`?draft=`) takes precedence.
  $effect(() => {
    if (draftId) return;
    const stored = sessionStorage.getItem("actic.newType");
    if (!stored) return;
    sessionStorage.removeItem("actic.newType");
    documentType = getDocumentType(stored).id;
  });

  let docType = $derived(getDocumentType(documentType));
  let isToday = $derived(dateIso === todayIso());

  function parseIso(iso: string): { year: number; month: number; day: number } {
    const [y, mo, d] = iso.split("-").map(Number);
    return { year: y ?? 2026, month: mo ?? 1, day: d ?? 1 };
  }

  let generatedSource = $derived(
    buildDocumentSource({
      type: docType.id,
      title,
      meeting,
      authors,
      lang,
      date: isToday ? undefined : parseIso(dateIso),
      body,
      yrkanden: { leadIn, items: yrkanden },
    }),
  );

  let source = $derived(advanced && forked ? manualSource : generatedSource);
  let files = $derived(signatureFiles(authors.map((a) => a.signature?.path)));

  // --- validation (body is intentionally NOT gated) -----------------------
  let touched = $state({ title: false, meeting: false, authors: false });
  let titleError = $derived(
    touched.title && !title.trim() ? m.actic_missing_title() : "",
  );
  let meetingError = $derived(
    touched.meeting && !meeting.trim() ? m.actic_missing_meeting() : "",
  );
  let authorsError = $derived(
    touched.authors && !authors.some((a) => a.name.trim())
      ? m.actic_missing_authors()
      : "",
  );

  let missing = $derived.by(() => {
    const out: string[] = [];
    if (!title.trim()) out.push(m.actic_missing_title());
    if (!meeting.trim()) out.push(m.actic_missing_meeting());
    if (!authors.some((a) => a.name.trim()))
      out.push(m.actic_missing_authors());
    return out;
  });
  let ready = $derived(missing.length === 0);

  // --- live preview -------------------------------------------------------
  let previewHost: HTMLElement | undefined = $state();
  let scrollBox: HTMLElement | undefined = $state();
  let compiling = $state(false);
  let error = $state("");
  let rendered = $state(false);
  let inFlight = false;
  let queued: string | null = null;
  let lastRenderMs = 0;

  function formatError(e: unknown): string {
    const raw = e instanceof Error ? e.message : String(e);
    const messages = [...raw.matchAll(/message:\s*"((?:[^"\\]|\\.)*)"/g)].map(
      (match) => (match[1] ?? "").replace(/\\n/g, "\n").replace(/\\"/g, '"'),
    );
    return messages.length > 0 ? messages.join("\n") : raw;
  }

  let previewPromise: Promise<Preview> | null = null;
  function getPreview(): Promise<Preview> {
    if (!previewHost) return Promise.reject(new Error("no preview host"));
    const root =
      previewHost.shadowRoot ?? previewHost.attachShadow({ mode: "open" });
    previewPromise ??= createPreview(root, PREVIEW_CSS);
    return previewPromise;
  }

  async function renderPreview(current: string, currentFiles: typeof files) {
    inFlight = true;
    compiling = true;
    const started = performance.now();
    const scrollTop = scrollBox?.scrollTop ?? 0;
    try {
      const preview = await getPreview();
      await preview.update(current, currentFiles);
      error = "";
      rendered = true;
      await tick();
      if (scrollBox) scrollBox.scrollTop = scrollTop;
    } catch (e) {
      error = formatError(e);
    } finally {
      lastRenderMs = performance.now() - started;
      inFlight = false;
      compiling = false;
      if (queued !== null) {
        const next = queued;
        queued = null;
        void renderPreview(next, files);
      }
    }
  }

  // The compiler now runs in a worker, so it no longer blocks typing; still
  // coalesce bursts so we don't queue a backlog of compiles.
  $effect(() => {
    const current = ready ? source : "";
    void files; // track signatures too
    if (!current) return;
    const delay = lastRenderMs > 200 ? 120 : 0;
    const timer = setTimeout(() => {
      if (inFlight) {
        queued = current;
        return;
      }
      void renderPreview(current, files);
    }, delay);
    return () => clearTimeout(timer);
  });

  // --- drag reorder (dnd-kit) ---------------------------------------------
  let authorSnapshot = $state<AuthorRow[]>([]);
  let yrkandeSnapshot = $state<YrkandeRow[]>([]);

  function addAuthor() {
    authors = [...authors, emptyAuthor()];
  }
  function removeAuthor(i: number) {
    authors = authors.filter((_, idx) => idx !== i);
    if (authors.length === 0) authors = [emptyAuthor()];
  }

  function addYrkande() {
    yrkanden = [...yrkanden, emptyYrkande()];
  }
  function removeYrkande(i: number) {
    yrkanden = yrkanden.filter((_, idx) => idx !== i);
    if (yrkanden.length === 0) yrkanden = [emptyYrkande()];
  }

  // --- advanced -----------------------------------------------------------
  function setAdvanced(value: boolean) {
    advanced = value;
    if (value && !forked) manualSource = generatedSource;
  }
  function resetFork() {
    forked = false;
    manualSource = generatedSource;
  }

  // --- drafts (manual save only) ------------------------------------------
  // A plain flag rather than re-serialising the whole form on every keystroke
  // (which is O(document size) and made typing feel sluggish on long documents).
  let dirty = $state(false);
  let skipFirstDirtyCheck = true;
  $effect(() => {
    // Touch every field so any change marks the form dirty.
    void [documentType, title, meeting, lang, dateIso, body, leadIn];
    void authors.map((a) => [
      a.name,
      a.message,
      a.position?.kind === "text" ? a.position.value : a.position?.path,
      a.signature?.path,
    ]);
    void yrkanden.map((y) => [y.clause, y.description]);
    if (skipFirstDirtyCheck) {
      skipFirstDirtyCheck = false;
      return;
    }
    dirty = true;
  });

  let hasContent = $derived(!!(title.trim() || meeting.trim() || body.trim()));

  function saveDraftNow() {
    if (!hasContent) return;
    draftId ??= crypto.randomUUID();
    saveDraft({
      id: draftId,
      updatedAt: Date.now(),
      type: documentType,
      title,
      meeting,
      // Signatures are ephemeral and are not persisted.
      authors: authors.map((author) => ({ ...author, signature: undefined })),
      lang,
      dateIso,
      body,
      leadIn,
      yrkanden: yrkanden.map((y) => ({ ...y })),
    });
    dirty = false;
    toast(m.actic_draft_saved(), "success");
  }

  $effect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveDraftNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  $effect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty && hasContent) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  });

  // --- download -----------------------------------------------------------
  let downloading = $state(false);

  function downloadSource() {
    const blob = new Blob([source], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${docType.id}-${slugify(meeting)}-${slugify(title)}.typ`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function download() {
    if (!ready) {
      touched = { title: true, meeting: true, authors: true };
      return;
    }
    downloading = true;
    error = "";
    try {
      const pdf = await renderTypstToPdf(source, files);
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${docType.id}-${slugify(meeting)}-${slugify(title)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      error = formatError(e);
    } finally {
      downloading = false;
    }
  }
</script>

<SetPageTitle title={m.actic_title()} />

<div class="layout-container flex flex-col gap-4">
  <Button variant="ghost" href="/actic" class="self-start">
    <ChevronLeft class="mr-1 h-4 w-4" />
    {m.actic_back()}
  </Button>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Left: form -->
    <div class="flex flex-col gap-5">
      <div class="flex items-center justify-between gap-4">
        <p class="text-muted-foreground text-sm">{docType.blurb()}</p>
        <Tabs.Root value={advanced ? "advanced" : "guided"}>
          <Tabs.List class="w-auto">
            <Tabs.Trigger
              value="guided"
              onclick={() => setAdvanced(false)}
              class="px-3 py-1.5"
            >
              {m.actic_mode_guided()}
            </Tabs.Trigger>
            <Tabs.Trigger
              value="advanced"
              onclick={() => setAdvanced(true)}
              class="px-3 py-1.5"
            >
              {m.actic_mode_advanced()}
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>

      {#if advanced}
        <div class="flex flex-col gap-2">
          {#if forked}
            <div
              class="border-alert-warning-background bg-alert-warning-background/15 flex items-start gap-2 rounded-md border p-3 text-sm"
            >
              <TriangleAlert
                class="text-alert-warning-background mt-0.5 h-4 w-4 shrink-0"
              />
              <div class="flex flex-col items-start gap-2">
                <p>{m.actic_forked_notice()}</p>
                <Button variant="outline" size="sm" onclick={resetFork}
                  >{m.actic_forked_reset()}</Button
                >
              </div>
            </div>
          {/if}
          <Textarea
            id="source"
            bind:value={manualSource}
            oninput={() => (forked = true)}
            spellcheck={false}
            class="min-h-[32rem] font-mono text-sm"
          />
        </div>
      {:else}
        <div class="flex items-start gap-3">
          <div class="flex flex-1 flex-col gap-1.5">
            <Label for="title"
              >{m.actic_field_title()}
              <span class="text-destructive">*</span></Label
            >
            <Input
              id="title"
              bind:value={title}
              placeholder={m.actic_field_title_placeholder()}
              aria-invalid={!!titleError}
              aria-errormessage={titleError}
              onblur={() => (touched.title = true)}
            />
          </div>
          <div class="flex w-36 flex-col gap-1.5">
            <Label for="meeting"
              >{m.actic_field_meeting()}
              <span class="text-destructive">*</span></Label
            >
            <Input
              id="meeting"
              bind:value={meeting}
              placeholder={m.actic_field_meeting_placeholder()}
              aria-invalid={!!meetingError}
              aria-errormessage={meetingError}
              onblur={() => (touched.meeting = true)}
            />
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-4">
          <div class="flex flex-col gap-1.5">
            <Label>{m.actic_field_type()}</Label>
            <div class="border-border flex overflow-hidden rounded-md border">
              {#each DOCUMENT_TYPES as type (type.id)}
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm whitespace-nowrap"
                  class:bg-primary={documentType === type.id}
                  class:text-primary-foreground={documentType === type.id}
                  onclick={() => (documentType = type.id)}
                >
                  {type.label()}
                </button>
              {/each}
            </div>
          </div>
          <div class="ml-auto flex flex-col gap-1.5">
            <Label>{m.actic_field_date()}</Label>
            <div class="flex items-center gap-2">
              <Button
                variant={isToday ? "rosa" : "outline"}
                size="sm"
                class="h-9"
                onclick={() => (dateIso = todayIso())}
              >
                {m.actic_date_today()}
              </Button>
              <DatePicker bind:value={dateIso} iso class="h-9" />
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="body">{m.actic_field_body()}</Label>
          {#snippet langSwitch()}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger
                class="hover:bg-accent hover:text-foreground flex h-8 items-center gap-1 rounded px-2 text-sm"
                aria-label={m.actic_field_lang()}
              >
                <Languages class="h-4 w-4" />
                {lang === "en" ? "EN" : "SV"}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item onclick={() => (lang = "sv")}
                  >Svenska</DropdownMenu.Item
                >
                <DropdownMenu.Item onclick={() => (lang = "en")}
                  >English</DropdownMenu.Item
                >
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          {/snippet}
          <TypstEditor
            id="body"
            bind:value={body}
            trailing={langSwitch}
            placeholder={m.actic_body_placeholder()}
          />
        </div>

        <details class="border-border rounded-md border" open>
          <summary class="cursor-pointer px-3 py-2 text-sm font-medium">
            {m.actic_yrkanden_title()}
          </summary>
          <div class="flex flex-col gap-3 px-3 pt-1 pb-3">
            <div class="flex flex-col gap-1.5">
              <Label for="leadIn" class="text-xs"
                >{m.actic_yrkanden_leadIn()}</Label
              >
              <Input
                id="leadIn"
                bind:value={leadIn}
                placeholder={m.actic_yrkanden_leadIn_placeholder()}
              />
            </div>
            <DragDropProvider
              onDragStart={() => (yrkandeSnapshot = yrkanden)}
              onDragOver={(event) => (yrkanden = move(yrkanden, event))}
              onDragEnd={(event) => {
                if (event.canceled) yrkanden = yrkandeSnapshot;
              }}
            >
              {#each yrkanden as yrkande, i (yrkande.id)}
                <SortableItem id={yrkande.id} index={i} group="yrkanden">
                  {#snippet children({ handle })}
                    <div class="flex items-start gap-2 rounded-md">
                      <span
                        use:attachAction={handle}
                        class="text-muted-foreground flex cursor-grab items-center gap-1 pt-2 text-sm"
                        role="button"
                        tabindex="0"
                        aria-label={m.actic_author_drag()}
                      >
                        <GripVertical class="h-4 w-4" />
                        {i + 1}
                      </span>
                      <span class="text-muted-foreground pt-2 text-sm"
                        >{m.actic_yrkanden_att()}</span
                      >
                      <div class="flex flex-1 flex-col gap-1.5">
                        <Textarea
                          bind:value={yrkande.clause}
                          placeholder={m.actic_yrkanden_clause_placeholder()}
                          class="min-h-9 resize-none"
                        />
                        <Textarea
                          bind:value={yrkande.description}
                          placeholder={m.actic_yrkanden_desc_placeholder()}
                          class="min-h-9 resize-none"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        class="mt-1"
                        aria-label={m.actic_yrkanden_remove()}
                        onclick={() => removeYrkande(i)}
                      >
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </div>
                  {/snippet}
                </SortableItem>
              {/each}
            </DragDropProvider>
            <Button variant="outline" size="sm" onclick={addYrkande}>
              <Plus class="mr-1 h-4 w-4" />
              {m.actic_yrkanden_add()}
            </Button>
          </div>
        </details>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label>{m.actic_field_authors()}</Label>
            <Button variant="outline" size="sm" onclick={addAuthor}>
              <Plus class="mr-1 h-4 w-4" />
              {m.actic_author_add()}
            </Button>
          </div>
          <DragDropProvider
            onDragStart={() => (authorSnapshot = authors)}
            onDragOver={(event) => (authors = move(authors, event))}
            onDragEnd={(event) => {
              if (event.canceled) authors = authorSnapshot;
            }}
          >
            <div
              class="grid grid-cols-1 gap-3 {authors.length <= 2
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-2 xl:grid-cols-3'}"
              onfocusout={() => (touched.authors = true)}
            >
              {#each authors as author, i (author.id)}
                <SortableItem id={author.id} index={i} group="authors">
                  {#snippet children({ handle })}
                    <AuthorCard
                      author={authors[i]!}
                      index={i}
                      {handle}
                      onremove={() => removeAuthor(i)}
                    />
                  {/snippet}
                </SortableItem>
              {/each}
            </div>
          </DragDropProvider>
          {#if authorsError}
            <p class="text-destructive text-xs">{authorsError}</p>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Right: preview -->
    <div
      class="flex flex-col gap-2 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Label>{m.actic_preview_label()}</Label>
          {#if compiling}<Spinner class="text-muted-foreground h-4 w-4" />{/if}
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onclick={saveDraftNow}
            disabled={!dirty || !hasContent}
          >
            <Save class="mr-1 h-4 w-4" />
            {m.actic_draft_save()}
          </Button>
          <Button onclick={downloadSource}>
            <FileCode class="mr-2 h-4 w-4" />
            {m.actic_download_source()}
          </Button>
          <Button onclick={download} disabled={downloading}>
            {#if downloading}
              <Spinner class="mr-2" />
            {:else}
              <Download class="mr-2 h-4 w-4" />
            {/if}
            {m.actic_download()}
          </Button>
        </div>
      </div>
      <div
        bind:this={scrollBox}
        class="bg-muted border-border min-h-[28rem] overflow-auto rounded-md border p-4 lg:min-h-0 lg:flex-1"
      >
        {#if error}
          <p
            class="text-destructive mb-4 text-sm break-words whitespace-pre-wrap"
          >
            {error}
          </p>
        {/if}
        {#if !ready && !forked}
          <div class="py-6 text-sm">
            <p class="mb-2">{m.actic_checklist_heading()}</p>
            <ul class="text-muted-foreground list-disc pl-5">
              {#each missing as item (item)}
                <li>{item}</li>
              {/each}
            </ul>
          </div>
        {:else}
          <div
            bind:this={previewHost}
            class="actic-preview"
            class:opacity-50={!!error}
          ></div>
          {#if !rendered && !error}
            <p class="text-muted-foreground text-sm">
              {m.actic_preview_empty()}
            </p>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>
