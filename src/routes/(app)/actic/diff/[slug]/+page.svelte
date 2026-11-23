<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SourceEditor from "$lib/actic/editor/SourceEditor.svelte";
  import { getDraft } from "$lib/actic/documents/drafts";
  import { page } from "$app/state";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import {
    Check,
    Download,
    FileCode,
    FileDiff,
    Minus,
    Plus,
    RotateCcw,
    Save,
    X,
  } from "@lucide/svelte/icons";
  import { toggleWrapAround } from "$lib/actic/editor/codemirror-commands";
  import type { EditorView } from "@codemirror/view";
  import * as m from "$paraglide/messages";
  import type { PageData } from "./$types";
  import { DiffSession } from "./editor.svelte";

  let { data }: { data: PageData } = $props();

  let session = $state<DiffSession>();
  const title = $derived(data.document?.title ?? data.slug);

  onMount(() => {
    const id = page.url.searchParams.get("draft");
    const draft = id ? getDraft(id) : undefined;
    session = new DiffSession({
      slug: data.slug,
      title: data.document?.title ?? data.slug,
      upstreamSource: data.source,
      assets: data.assets,
      draft: draft?.kind === "diff" && draft.slug === data.slug ? draft : null,
    });
  });

  $effect(() => {
    // Preview compilation, diff generation, draft save and shortcuts live
    // exactly as long as this page.
    session?.runEffects();
  });
</script>

<SetPageTitle {title} />

<div class="layout-container flex flex-col gap-4">
  <Button variant="ghost" href="/actic" class="self-start">
    <ChevronLeft class="mr-1 h-4 w-4" />
    {m.back()}
  </Button>

  {#if data.error === "upstream" && !data.source && !session}
    <div class="border-border bg-muted rounded-md border p-4 text-sm">
      {m.actic_diff_upstream_error()}
    </div>
  {:else if !session}
    <p class="text-muted-foreground text-sm">{m.actic_preview_empty()}</p>
  {:else}
    {#if data.assetWarning}
      <p class="text-muted-foreground text-sm">
        {m.actic_diff_asset_warning()}
      </p>
    {/if}
    {#if data.error === "upstream" && !data.source}
      <p class="text-muted-foreground text-sm">
        {m.actic_diff_draft_offline()}
      </p>
    {/if}
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {#snippet trailing(cmView: EditorView | undefined)}
        {#if !session!.autodiff}
          <button
            type="button"
            class="text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px]"
            aria-label={m.actic_diff_marker_added()}
            title={m.actic_diff_marker_added()}
            onclick={() => cmView && toggleWrapAround(cmView, "#add[", "]")}
          >
            <Plus class="size-4" />
          </button>
          <button
            type="button"
            class="text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px]"
            aria-label={m.actic_diff_marker_deleted()}
            title={m.actic_diff_marker_deleted()}
            onclick={() => cmView && toggleWrapAround(cmView, "#remove[", "]")}
          >
            <Minus class="size-4" />
          </button>
        {/if}
        <button
          type="button"
          class="text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px] disabled:pointer-events-none disabled:opacity-50"
          aria-label={m.actic_diff_reset()}
          title={m.actic_diff_reset()}
          disabled={!session!.canReset}
          onclick={() => session!.reset()}
        >
          <RotateCcw class="size-4" />
        </button>
      {/snippet}
      <div class="flex flex-col gap-2">
        <SourceEditor
          bind:value={session.source}
          diagnostics={session.diagnostics}
          {title}
          {trailing}
          diffMarkers
          downloadItems={[
            ...(session.autodiff
              ? [
                  {
                    label: m.actic_download_diff_source(),
                    icon: FileDiff,
                    disabled: !session.diffAvailable,
                    run: () => session!.downloadDiffSource(),
                  },
                ]
              : []),
            {
              label: m.actic_download_source(),
              icon: FileCode,
              run: () => session!.downloadSource(),
            },
          ]}
        />
      </div>

      <div
        class="flex flex-col gap-2 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]"
      >
        <div
          class="border-border bg-background flex min-h-[28rem] flex-col overflow-hidden rounded-lg border lg:min-h-0 lg:flex-1"
        >
          <div
            class="bg-muted-background text-muted-foreground flex h-11 shrink-0 items-center gap-2 border-b px-[7px]"
          >
            <!-- The title lives on a wrapper: a disabled button ignores
                 pointer events, so its own title tooltip can never show. -->
            <span
              title={session.canAutodiff
                ? undefined
                : m.actic_diff_autodiff_disabled()}
            >
              <button
                type="button"
                class="text-muted-foreground hover:bg-accent hover:text-foreground flex h-[30px] items-center gap-1.5 rounded-[13px] px-[7px] text-sm disabled:pointer-events-none disabled:opacity-50"
                class:text-foreground={session.autodiff}
                aria-pressed={session.autodiff}
                disabled={!session.canAutodiff}
                onclick={() => (session!.autodiff = !session!.autodiff)}
              >
                {#if session.autodiff}
                  <Check class="size-4" />
                {:else}
                  <X class="size-4" />
                {/if}
                {m.actic_diff_autodiff()}
              </button>
            </span>
            <div class="ml-auto flex items-center gap-0.5">
              {#if session.compiling}
                <Spinner class="text-muted-foreground h-4 w-4" />
              {/if}
              <button
                type="button"
                class="text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px] disabled:pointer-events-none disabled:opacity-50"
                title={m.actic_draft_save()}
                aria-label={m.actic_draft_save()}
                onclick={() => session!.saveDraftNow()}
                disabled={!session.dirty || !session.source.trim()}
              >
                <Save class="size-4" />
              </button>
              <button
                type="button"
                class="text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px] disabled:pointer-events-none disabled:opacity-50"
                title={m.actic_download()}
                aria-label={m.actic_download()}
                onclick={() => session!.downloadPdf()}
                disabled={session.downloading}
              >
                {#if session.downloading}
                  <Spinner class="size-4" />
                {:else}
                  <Download class="size-4" />
                {/if}
              </button>
            </div>
          </div>
          <div
            bind:this={session.scrollBox}
            class="bg-muted min-h-0 flex-1 overflow-auto p-4"
          >
            {#if session.error || session.diffError || session.diffResult.error}
              <div class="bg-muted sticky top-0 z-10 flex flex-col gap-2 pb-4">
                {#if session.error}
                  <p
                    class="text-destructive text-sm break-words whitespace-pre-wrap"
                  >
                    {session.error}
                  </p>
                {/if}
                {#if session.diffError}
                  <p
                    class="text-destructive text-sm break-words whitespace-pre-wrap"
                  >
                    {session.diffError}
                  </p>
                {/if}
                {#if session.diffResult.error}
                  <p
                    class="text-destructive text-sm break-words whitespace-pre-wrap"
                  >
                    {session.diffResult.error}
                  </p>
                {/if}
              </div>
            {/if}
            <div
              bind:this={session.previewHost}
              class="actic-preview"
              class:opacity-50={!!session.error}
            ></div>
            {#if !session.rendered && !session.error}
              <p class="text-muted-foreground text-sm">
                {m.actic_preview_empty()}
              </p>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
