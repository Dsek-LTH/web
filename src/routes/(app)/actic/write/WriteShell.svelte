<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
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
    {m.actic_back()}
  </Button>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Left: form -->
    <div class="flex flex-col gap-5">
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

      {#if writer.advanced}
        <div class="flex flex-col gap-2">
          {#if writer.forked}
            <div
              class="border-alert-warning-background bg-alert-warning-background/15 flex items-start gap-2 rounded-md border p-3 text-sm"
            >
              <TriangleAlert
                class="text-alert-warning-background mt-0.5 h-4 w-4 shrink-0"
              />
              <div class="flex flex-col items-start gap-2">
                <p>{m.actic_forked_notice()}</p>
                <Button variant="outline" size="sm" onclick={() => writer.resetFork()}
                  >{m.actic_forked_reset()}</Button
                >
              </div>
            </div>
          {/if}
          <Textarea
            id="source"
            bind:value={writer.manualSource}
            oninput={() => (writer.forked = true)}
            spellcheck={false}
            class="{FIELD_BG} min-h-[32rem] font-mono text-sm"
          />
        </div>
      {:else}
        {@render children?.()}
      {/if}
    </div>

    <!-- Right: preview -->
    <div
      class="flex flex-col gap-2 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Label>{m.actic_preview_label()}</Label>
          {#if writer.compiling}
            <Spinner class="text-muted-foreground h-4 w-4" />
          {/if}
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onclick={() => writer.saveDraftNow()}
            disabled={!writer.dirty || !writer.hasContent}
          >
            <Save class="mr-1 h-4 w-4" />
            {m.actic_draft_save()}
          </Button>
          <Button onclick={() => writer.downloadSource()}>
            <FileCode class="mr-2 h-4 w-4" />
            {m.actic_download_source()}
          </Button>
          <Button
            onclick={() => writer.download()}
            disabled={writer.downloading}
          >
            {#if writer.downloading}
              <Spinner class="mr-2" />
            {:else}
              <Download class="mr-2 h-4 w-4" />
            {/if}
            {m.actic_download()}
          </Button>
        </div>
      </div>
      <div
        bind:this={writer.scrollBox}
        class="bg-muted border-border min-h-[28rem] overflow-auto rounded-md border p-4 lg:min-h-0 lg:flex-1"
      >
        {#if writer.error}
          <p
            class="text-destructive mb-4 text-sm break-words whitespace-pre-wrap"
          >
            {writer.error}
          </p>
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
