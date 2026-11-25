<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { Download, RefreshCw, Save, Zap } from "@lucide/svelte/icons";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import * as m from "$paraglide/messages";
  import ToolbarButton from "./ToolbarButton.svelte";
  import { watchStickyTop } from "./sticky-top";

  let {
    compiling = false,
    downloading = false,
    dirty = false,
    canSave = false,
    canDownload = true,
    error = "",
    rendered = false,
    showHost = true,
    autocompile = $bindable(true),
    onsave,
    oncompile,
    ondownload,
    leading,
    beforeToolbar,
    placeholder,
    scrollBox = $bindable<HTMLElement | undefined>(),
    previewHost = $bindable<HTMLElement | undefined>(),
  }: {
    compiling?: boolean;
    downloading?: boolean;
    dirty?: boolean;
    /** Extra save gate beside `dirty` (e.g. non-empty source). */
    canSave?: boolean;
    /** Extra download gate (e.g. /write's required-fields check). */
    canDownload?: boolean;
    /** Shown in a sticky box; also dims the preview and hides the empty note. */
    error?: string;
    rendered?: boolean;
    /** Render the `.actic-preview` host; `false` swaps in `placeholder`. */
    showHost?: boolean;
    /** Whether the preview compiles itself; the zap toggle and the manual
     * compile button (greyed out while this is on) drive it. */
    autocompile?: boolean;
    onsave: () => void;
    /** Manual compile — only reachable while `autocompile` is off. */
    oncompile: () => void;
    ondownload: () => void;
    /** Toolbar-left content (e.g. the panel title). */
    leading?: Snippet;
    /** Page-specific buttons first in the right cluster (e.g. diff's
     * autodiff toggle). */
    beforeToolbar?: Snippet;
    /** Shown instead of the host while it doesn't exist (e.g. a checklist). */
    placeholder?: Snippet;
    scrollBox?: HTMLElement | undefined;
    previewHost?: HTMLElement | undefined;
  } = $props();

  // The toolbar pins under the site header while the page scrolls (on
  // desktop the panel itself is sticky, so this is a no-op there).
  onMount(() => watchStickyTop());
</script>

<div class="flex flex-col gap-2 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
  <div
    class="border-border bg-background flex min-h-[28rem] flex-col overflow-clip rounded-lg border lg:min-h-0 lg:flex-1"
  >
    <div
      class="bg-muted-background text-muted-foreground z-10 flex h-11 shrink-0 items-center gap-2 border-b px-[7px] max-lg:sticky max-lg:top-(--actic-sticky-top,4rem)"
    >
      {@render leading?.()}
      <div class="ml-auto flex items-center gap-0.5">
        {#if compiling}
          <Spinner class="text-muted-foreground h-4 w-4" />
        {/if}
        {@render beforeToolbar?.()}
        <ToolbarButton
          label={m.actic_preview_autocompile()}
          active={autocompile}
          pressed={autocompile}
          underline
          onclick={() => (autocompile = !autocompile)}
        >
          <Zap class="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={m.actic_preview_compile()}
          shortcut="Mod-Enter"
          description={autocompile
            ? m.actic_preview_compile_disabled()
            : undefined}
          disabled={autocompile}
          onclick={oncompile}
        >
          <RefreshCw class="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={m.actic_draft_save()}
          shortcut="Mod-S"
          disabled={!dirty || !canSave}
          onclick={onsave}
        >
          <Save class="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={m.actic_download()}
          shortcut="Mod-Shift-S"
          // A failed compile means the PDF would be stale or broken — no
          // download until it compiles (and /write also gates on required
          // fields via `canDownload`).
          disabled={downloading || !!error || !canDownload}
          onclick={ondownload}
        >
          {#if downloading}
            <Spinner class="size-4" />
          {:else}
            <Download class="size-4" />
          {/if}
        </ToolbarButton>
      </div>
    </div>
    <div
      bind:this={scrollBox}
      class="bg-muted min-h-0 flex-1 overflow-auto p-4"
    >
      {#if error}
        <div class="bg-muted sticky top-0 z-10 pb-4">
          <p class="text-destructive text-sm break-words whitespace-pre-wrap">
            {error}
          </p>
        </div>
      {/if}
      {#if showHost}
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
      {:else if placeholder}
        {@render placeholder()}
      {/if}
    </div>
  </div>
</div>
