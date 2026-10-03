<script lang="ts">
  import { tick } from "svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { defaultTemplate } from "$lib/actic/templates";
  import { renderTypstToPdf, renderTypstToSvg } from "$lib/actic/typst";
  import * as m from "$paraglide/messages";
  import Download from "@lucide/svelte/icons/download";

  /**
   * The Typst SVG ships its own `<style>`. An inline SVG's stylesheet is
   * document-wide, and it contains `svg { fill: none }` — which, being
   * unlayered, overrides Tailwind's layered `fill-*` utilities on *every* SVG
   * on the page (it blanks out the header logo). Rendering the preview inside a
   * shadow root isolates those styles, so they can only affect the preview.
   * The page's own styles also can't reach in, so the sizing/paper background
   * live here instead.
   */
  const PREVIEW_CSS =
    "svg{display:block;width:100%;height:auto;background:#fff}";

  let source = $state(defaultTemplate);
  let error = $state("");
  let compiling = $state(false);
  let downloading = $state(false);
  let rendered = $state(false);

  let scrollBox: HTMLElement | undefined = $state();
  let previewHost: HTMLElement | undefined = $state();

  // Live-preview scheduler (kept non-reactive so it never re-triggers the
  // effect): while a compile is running we remember only the newest source, so
  // fast typing coalesces into the latest document instead of a backlog.
  let inFlight = false;
  let queued: string | null = null;

  /** Turn the raw Rust diagnostic dump into the human-readable messages. */
  function formatError(e: unknown): string {
    const raw = e instanceof Error ? e.message : String(e);
    const messages = [...raw.matchAll(/message:\s*"((?:[^"\\]|\\.)*)"/g)].map(
      (match) => (match[1] ?? "").replace(/\\n/g, "\n").replace(/\\"/g, '"'),
    );
    return messages.length > 0 ? messages.join("\n") : raw;
  }

  async function renderPreview(current: string) {
    inFlight = true;
    compiling = true;
    const scrollTop = scrollBox?.scrollTop ?? 0;
    try {
      const svg = await renderTypstToSvg(current);
      if (previewHost) {
        const root =
          previewHost.shadowRoot ?? previewHost.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = PREVIEW_CSS;
        root.innerHTML = svg;
        root.prepend(style);
      }
      error = "";
      rendered = true;
      // Replacing the document resets scroll, so put the reader back.
      await tick();
      if (scrollBox) scrollBox.scrollTop = scrollTop;
    } catch (e) {
      // The previous render stays on screen; only the error is surfaced.
      error = formatError(e);
    } finally {
      inFlight = false;
      compiling = false;
      if (queued !== null) {
        const next = queued;
        queued = null;
        void renderPreview(next);
      }
    }
  }

  $effect(() => {
    const current = source;
    if (inFlight) {
      queued = current;
      return;
    }
    void renderPreview(current);
  });

  async function download() {
    downloading = true;
    error = "";
    try {
      const pdf = await renderTypstToPdf(source);
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "dokument.pdf";
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

<div class="layout-container flex flex-col gap-6">
  <div class="flex flex-col gap-1">
    <h1 class="text-3xl font-bold">{m.actic_title()}</h1>
    <p class="text-muted-foreground">{m.actic_description()}</p>
  </div>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <div class="flex flex-col gap-3">
      <Label for="source">{m.actic_source_label()}</Label>
      <Textarea
        id="source"
        bind:value={source}
        spellcheck={false}
        class="min-h-[28rem] font-mono text-sm"
      />
      <Button onclick={download} disabled={downloading} class="self-start">
        {#if downloading}
          <Spinner class="mr-2" />
        {:else}
          <Download class="mr-2 h-4 w-4" />
        {/if}
        {m.actic_download()}
      </Button>
    </div>

    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <Label>{m.actic_preview_label()}</Label>
        {#if compiling}
          <Spinner class="text-muted-foreground h-4 w-4" />
        {/if}
      </div>
      <div
        bind:this={scrollBox}
        class="bg-muted border-border min-h-[28rem] overflow-auto rounded-md border p-4"
      >
        {#if error}
          <p
            class="text-destructive mb-4 text-sm break-words whitespace-pre-wrap"
          >
            {error}
          </p>
        {/if}
        <div bind:this={previewHost} class:opacity-50={!!error}></div>
        {#if !rendered && !error}
          <p class="text-muted-foreground text-sm">{m.actic_preview_empty()}</p>
        {/if}
      </div>
    </div>
  </div>
</div>
