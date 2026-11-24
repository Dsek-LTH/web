<script lang="ts">
  import type { Snippet } from "svelte";
  import { Download, Save } from "@lucide/svelte/icons";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import * as m from "$paraglide/messages";

  let {
    compiling = false,
    downloading = false,
    dirty = false,
    canSave = false,
    error = "",
    rendered = false,
    showHost = true,
    onsave,
    ondownload,
    leading,
    placeholder,
    scrollBox = $bindable<HTMLElement | undefined>(),
    previewHost = $bindable<HTMLElement | undefined>(),
  }: {
    compiling?: boolean;
    downloading?: boolean;
    dirty?: boolean;
    /** Extra save gate beside `dirty` (e.g. non-empty source). */
    canSave?: boolean;
    /** Shown in a sticky box; also dims the preview and hides the empty note. */
    error?: string;
    rendered?: boolean;
    /** Render the `.actic-preview` host; `false` swaps in `placeholder`. */
    showHost?: boolean;
    onsave: () => void;
    ondownload: () => void;
    /** Toolbar-left content (e.g. an autodiff toggle or the panel title). */
    leading?: Snippet;
    /** Shown instead of the host while it doesn't exist (e.g. a checklist). */
    placeholder?: Snippet;
    scrollBox?: HTMLElement | undefined;
    previewHost?: HTMLElement | undefined;
  } = $props();
</script>

<div class="flex flex-col gap-2 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
  <div
    class="border-border bg-background flex min-h-[28rem] flex-col overflow-hidden rounded-lg border lg:min-h-0 lg:flex-1"
  >
    <div
      class="bg-muted-background text-muted-foreground flex h-11 shrink-0 items-center gap-2 border-b px-[7px]"
    >
      {@render leading?.()}
      <div class="ml-auto flex items-center gap-0.5">
        {#if compiling}
          <Spinner class="text-muted-foreground h-4 w-4" />
        {/if}
        <button
          type="button"
          class="text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px] disabled:pointer-events-none disabled:opacity-50"
          title={m.actic_draft_save()}
          aria-label={m.actic_draft_save()}
          onclick={onsave}
          disabled={!dirty || !canSave}
        >
          <Save class="size-4" />
        </button>
        <button
          type="button"
          class="text-muted-foreground hover:bg-accent hover:text-foreground rounded-[13px] p-[7px] disabled:pointer-events-none disabled:opacity-50"
          title={m.actic_download()}
          aria-label={m.actic_download()}
          onclick={ondownload}
          disabled={downloading}
        >
          {#if downloading}
            <Spinner class="size-4" />
          {:else}
            <Download class="size-4" />
          {/if}
        </button>
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
