<script lang="ts">
  import { onMount } from "svelte";
  import * as Tabs from "$lib/components/ui/tabs";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SourceEditor from "$lib/actic/editor/SourceEditor.svelte";
  import { getDraft } from "$lib/actic/documents/drafts";
  import { page } from "$app/state";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import { Download, FileCode, RotateCcw, Save } from "@lucide/svelte/icons";
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
      {#snippet trailing()}
        <button
          type="button"
          class="text-muted-foreground hover:bg-accent hover:text-foreground rounded p-2 disabled:pointer-events-none disabled:opacity-50"
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
        />
        <div class="flex justify-end">
          <Button variant="outline" onclick={() => session!.downloadSource()}>
            <FileCode class="mr-2 h-4 w-4" />
            {m.actic_download_source()}
          </Button>
        </div>
      </div>

      <div
        class="flex flex-col gap-2 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <Tabs.Root value={session.tab}>
            <Tabs.List class="w-auto">
              <Tabs.Trigger
                value="updated"
                onclick={() => (session!.tab = "updated")}
                class="px-3 py-1.5"
              >
                {m.actic_diff_preview_updated()}
              </Tabs.Trigger>
              <Tabs.Trigger
                value="diff"
                onclick={() => (session!.tab = "diff")}
                disabled={!session.diffAvailable}
                class="px-3 py-1.5"
              >
                {m.actic_diff_preview_diff()}
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
          <div class="flex items-center gap-2">
            {#if session.compiling}
              <Spinner class="text-muted-foreground h-4 w-4" />
            {/if}
            <Button
              variant="outline"
              size="sm"
              onclick={() => session!.saveDraftNow()}
              disabled={!session.dirty || !session.source.trim()}
            >
              <Save class="mr-1 h-4 w-4" />
              {m.actic_draft_save()}
            </Button>
            <Button
              size="sm"
              onclick={() => session!.downloadPdf()}
              disabled={session.downloading}
            >
              {#if session.downloading}
                <Spinner class="mr-2" />
              {:else}
                <Download class="mr-1 h-4 w-4" />
              {/if}
              {m.actic_download()}
            </Button>
          </div>
        </div>

        <div
          bind:this={session.scrollBox}
          class="bg-muted border-border min-h-[28rem] overflow-auto rounded-md border p-4 lg:min-h-0 lg:flex-1"
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
  {/if}
</div>
