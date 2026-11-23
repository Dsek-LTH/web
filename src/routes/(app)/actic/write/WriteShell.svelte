<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SourceEditor from "$lib/actic/editor/SourceEditor.svelte";
  import type { Snippet } from "svelte";
  import {
    Download,
    FileCode,
    Save,
    TriangleAlert,
  } from "@lucide/svelte/icons";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import * as m from "$paraglide/messages";
  import type { Writer } from "./writer.svelte";

  let {
    writer,
    children,
  }: {
    writer: Writer;
    /** The guided form fields; replaced by the source editor in advanced mode. */
    children?: Snippet;
  } = $props();

  $effect(() => {
    // Preview compilation, draft load/save, dirty tracking and the keyboard
    // shortcuts — created here so they live exactly as long as this shell.
    writer.runEffects();
  });
</script>

<SetPageTitle title={m.actic_title()} />

<div class="layout-container flex flex-col gap-4">
  <Button variant="ghost" href="/actic" class="self-start">
    <ChevronLeft class="mr-1 h-4 w-4" />
    {m.back()}
  </Button>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Left: form -->
    <div class="flex flex-col gap-7">
      <div class="flex items-center justify-between gap-4">
        <p class="text-muted-foreground text-sm">{writer.activeType.blurb()}</p>
        <Tabs.Root value={writer.advanced ? "advanced" : "guided"}>
          <Tabs.List class="w-auto">
            <Tabs.Trigger
              value="guided"
              onclick={() => writer.setAdvanced(false)}
              class="px-3 py-1.5"
            >
              {m.actic_mode_guided()}
            </Tabs.Trigger>
            <Tabs.Trigger
              value="advanced"
              onclick={() => writer.setAdvanced(true)}
              class="px-3 py-1.5"
            >
              {m.actic_mode_advanced()}
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>

      {#if writer.forked}
        <!-- Shown in both modes: once the source has been edited by hand, the
             guided fields no longer drive the preview. -->
        <div
          class="border-alert-warning-background bg-alert-warning-background/15 flex items-start gap-2 rounded-md border p-3 text-sm"
        >
          <TriangleAlert
            class="text-alert-warning-background mt-0.5 h-4 w-4 shrink-0"
          />
          <div class="flex flex-col items-start gap-2">
            <p>{m.actic_forked_notice()}</p>
            <Button
              variant="outline"
              size="sm"
              onclick={() => writer.resetFork()}
              >{m.actic_forked_reset()}</Button
            >
          </div>
        </div>
      {/if}

      {#if writer.advanced}
        <SourceEditor
          bind:value={writer.manualSource}
          diagnostics={writer.diagnostics}
          oninput={() => (writer.forked = true)}
          downloadItems={[
            {
              label: m.actic_download_source(),
              run: () => writer.downloadSource(),
            },
          ]}
        />
      {:else}
        {@render children?.()}
      {/if}
    </div>

    <!-- Right: preview -->
    <div
      class="flex flex-col gap-2 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]"
    >
      <div
        class="border-border bg-background flex min-h-[28rem] flex-col overflow-hidden rounded-lg border lg:min-h-0 lg:flex-1"
      >
        <div
          class="bg-muted-background text-muted-foreground flex h-11 shrink-0 items-center gap-2 border-b px-[7px]"
        >
          <div class="min-w-0 flex-1">
            <span class="text-foreground truncate pl-[7px] text-sm font-medium">
              {m.actic_preview_title()}
            </span>
          </div>
          <div class="ml-auto flex items-center gap-0.5">
            {#if writer.compiling}
              <Spinner class="text-muted-foreground h-4 w-4" />
            {/if}
            <button
              type="button"
              class="text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px] disabled:pointer-events-none disabled:opacity-50"
              title={m.actic_draft_save()}
              aria-label={m.actic_draft_save()}
              onclick={() => writer.saveDraftNow()}
              disabled={!writer.dirty || !writer.hasContent}
            >
              <Save class="size-4" />
            </button>
            <button
              type="button"
              class="text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px] disabled:pointer-events-none disabled:opacity-50"
              title={m.actic_download()}
              aria-label={m.actic_download()}
              onclick={() => writer.download()}
              disabled={writer.downloading}
            >
              {#if writer.downloading}
                <Spinner class="size-4" />
              {:else}
                <Download class="size-4" />
              {/if}
            </button>
          </div>
        </div>
        <div
          bind:this={writer.scrollBox}
          class="bg-muted min-h-0 flex-1 overflow-auto p-4"
        >
          {#if writer.error}
            <div class="bg-muted sticky top-0 z-10 pb-4">
              <p
                class="text-destructive text-sm break-words whitespace-pre-wrap"
              >
                {writer.error}
              </p>
            </div>
          {/if}
          {#if !writer.ready && !writer.forked}
            <div class="py-6 text-sm">
              <p class="mb-2">{m.actic_checklist_heading()}</p>
              <ul class="text-muted-foreground list-disc pl-5">
                {#each writer.missing as item (item)}
                  <li>{item}</li>
                {/each}
              </ul>
            </div>
          {:else}
            <div
              bind:this={writer.previewHost}
              class="actic-preview"
              class:opacity-50={!!writer.error}
            ></div>
            {#if !writer.rendered && !writer.error}
              <p class="text-muted-foreground text-sm">
                {m.actic_preview_empty()}
              </p>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
