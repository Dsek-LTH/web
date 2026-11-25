<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs";
  import { Button } from "$lib/components/ui/button/index.js";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SourceEditor from "$lib/actic/editor/SourceEditor.svelte";
  import PreviewPanel from "$lib/actic/editor/PreviewPanel.svelte";
  import { beforeNavigate } from "$app/navigation";
  import type { Snippet } from "svelte";
  import { TriangleAlert } from "@lucide/svelte/icons";
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

  // In-app navigation never fires beforeunload, so the dirty check needs
  // this twin guard (runs during component initialisation, as required).
  // Reload-style navigations (back button via data-sveltekit-reload, the
  // native dialog covers those) are left to the browser.
  beforeNavigate((navigation) => {
    if (
      writer.dirty &&
      !navigation.willUnload &&
      !window.confirm(m.actic_unsaved_confirm())
    ) {
      navigation.cancel();
    }
  });
</script>

<SetPageTitle title={m.actic_title()} />

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
    <PreviewPanel
      bind:scrollBox={writer.scrollBox}
      bind:previewHost={writer.previewHost}
      compiling={writer.compiling}
      downloading={writer.downloading}
      dirty={writer.dirty}
      canSave={writer.hasContent}
      error={writer.error}
      rendered={writer.rendered}
      showHost={writer.ready || writer.forked}
      bind:autocompile={writer.autocompile}
      oncompile={() => writer.compileNow()}
      onsave={() => writer.saveDraftNow()}
      ondownload={() => writer.download()}
    >
      {#snippet leading()}
        <div class="min-w-0 flex-1">
          <span class="text-foreground truncate pl-[7px] text-sm font-medium">
            {m.actic_preview_title()}
          </span>
        </div>
      {/snippet}
      {#snippet placeholder()}
        <div class="py-6 text-sm">
          <p class="mb-2">{m.actic_checklist_heading()}</p>
          <ul class="text-muted-foreground list-disc pl-5">
            {#each writer.missing as item (item)}
              <li>{item}</li>
            {/each}
          </ul>
        </div>
      {/snippet}
    </PreviewPanel>
  </div>
</div>
