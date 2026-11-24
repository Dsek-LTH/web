<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SourceEditor from "$lib/actic/editor/SourceEditor.svelte";
  import PreviewPanel from "$lib/actic/editor/PreviewPanel.svelte";
  import { getDraft } from "$lib/actic/documents/drafts";
  import { page } from "$app/state";
  import { beforeNavigate } from "$app/navigation";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import {
    Check,
    FileCode,
    FileDiff,
    Minus,
    Plus,
    RotateCcw,
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

  // In-app navigation never fires beforeunload, so the dirty check needs
  // this twin guard (runs during component initialisation, as required).
  // Reload-style navigations (back button via data-sveltekit-reload, the
  // native dialog covers those) are left to the browser.
  beforeNavigate((navigation) => {
    if (
      session?.dirty &&
      !navigation.willUnload &&
      !window.confirm(m.actic_unsaved_confirm())
    ) {
      navigation.cancel();
    }
  });

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
  <Button
    variant="ghost"
    href="/actic"
    class="self-start"
    data-sveltekit-reload
  >
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

      <PreviewPanel
        bind:scrollBox={session.scrollBox}
        bind:previewHost={session.previewHost}
        compiling={session.compiling}
        downloading={session.downloading}
        dirty={session.dirty}
        canSave={!!session.source.trim()}
        error={[session.error, session.diffError, session.diffResult.error]
          .filter(Boolean)
          .join("\n\n")}
        rendered={session.rendered}
        onsave={() => session!.saveDraftNow()}
        ondownload={() => session!.downloadPdf()}
      >
        {#snippet leading()}
          <!-- The title lives on a wrapper: a disabled button ignores
               pointer events, so its own title tooltip can never show. -->
          <span
            title={session!.canAutodiff
              ? undefined
              : m.actic_diff_autodiff_disabled()}
          >
            <button
              type="button"
              class="text-muted-foreground hover:bg-accent hover:text-foreground flex h-[30px] items-center gap-1.5 rounded-[13px] px-[7px] text-sm disabled:pointer-events-none disabled:opacity-50"
              class:text-foreground={session!.autodiff}
              aria-pressed={session!.autodiff}
              disabled={!session!.canAutodiff}
              onclick={() => (session!.autodiff = !session!.autodiff)}
            >
              {#if session!.autodiff}
                <Check class="size-4" />
              {:else}
                <X class="size-4" />
              {/if}
              {m.actic_diff_autodiff()}
            </button>
          </span>
        {/snippet}
      </PreviewPanel>
    </div>
  {/if}
</div>
