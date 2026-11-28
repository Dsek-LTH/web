<script lang="ts">
  import { Textarea } from "$lib/components/ui/textarea";
  import { FIELD_BG } from "$lib/actic/fieldStyles";
  import Heading from "@lucide/svelte/icons/heading";
  import Bold from "@lucide/svelte/icons/bold";
  import Italic from "@lucide/svelte/icons/italic";
  import Strikethrough from "@lucide/svelte/icons/strikethrough";
  import Link from "@lucide/svelte/icons/link";
  import List from "@lucide/svelte/icons/list";
  import ListOrdered from "@lucide/svelte/icons/list-ordered";
  import Code from "@lucide/svelte/icons/code";
  import SquareCode from "@lucide/svelte/icons/square-code";
  import Table from "@lucide/svelte/icons/table";
  import FileText from "@lucide/svelte/icons/file-text";
  import * as m from "$paraglide/messages";
  import type { WithoutChildren, WithElementRef } from "bits-ui";
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import {
    cycleHeading,
    dedent,
    indent,
    insertLink,
    insertTable,
    isWrapped,
    lineHasHeading,
    lineHasPrefix,
    listContinuation,
    toggleBold,
    toggleBullet,
    toggleCodeBlock,
    toggleInlineCode,
    toggleItalic,
    toggleNumbered,
    toggleStrike,
  } from "./typst-commands";
  import { insertText } from "$lib/components/textareacommands";
  import ToolbarButton from "./ToolbarButton.svelte";
  import EditorToolbar from "./EditorToolbar.svelte";
  import { onMount } from "svelte";
  import { watchStickyTop } from "./sticky-top";

  let {
    value = $bindable(""),
    placeholder = "",
    pageActions,
    compact = false,
    ...restProps
  }: {
    value?: string;
    placeholder?: string;
    /** Extra toolbar buttons owned by the page. */
    pageActions?: Snippet;
    /** Half the default min-height — for pages where other boxes should be
     * visible without scrolling (requirements profile). */
    compact?: boolean;
  } & WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();

  let textarea: HTMLTextAreaElement | null = $state(null);
  let active = $state({
    heading: false,
    bold: false,
    italic: false,
    strike: false,
    code: false,
    bullet: false,
    numbered: false,
  });
  let chars = $state(0);
  let words = $state(0);

  function refresh() {
    active = {
      heading: lineHasHeading(textarea),
      bold: isWrapped(textarea, "*", "*"),
      italic: isWrapped(textarea, "_", "_"),
      strike: isWrapped(textarea, "#strike[", "]"),
      code: isWrapped(textarea, "`", "`"),
      bullet: lineHasPrefix(textarea, "- "),
      numbered: lineHasPrefix(textarea, "+ "),
    };
    chars = value.length;
    words = value.trim() ? value.trim().split(/\s+/).length : 0;
  }

  function run(command: (el: HTMLTextAreaElement | null) => void) {
    command(textarea);
    refresh();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      run(event.shiftKey ? dedent : indent);
      return;
    }
    // Continue `-`/`+` list items on Enter (plain, unmodified Enter only —
    // term lists never continue; see `listContinuation`).
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !(event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      textarea
    ) {
      const lineStart =
        textarea.value.lastIndexOf("\n", textarea.selectionStart - 1) + 1;
      const marker = listContinuation(
        textarea.value.slice(lineStart, textarea.selectionStart),
      );
      if (marker) {
        event.preventDefault();
        insertText(textarea, marker);
        refresh();
        return;
      }
      // Plain newline; fall through to the textarea's default behaviour.
      return;
    }
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (event.shiftKey) {
      if (key === "x") {
        event.preventDefault();
        run(toggleStrike);
      }
      return;
    }
    const shortcuts: Record<string, (el: HTMLTextAreaElement | null) => void> =
      {
        b: toggleBold,
        i: toggleItalic,
        e: toggleInlineCode,
        k: insertLink,
      };
    const command = shortcuts[key];
    if (command) {
      event.preventDefault();
      run(command);
    }
  }

  // Keeps `--actic-sticky-top` current for the toolbar's sticky top.
  onMount(() => watchStickyTop());
</script>

<div class="border-border flex w-full flex-col overflow-clip rounded-lg border">
  <!-- Toolbar and textarea share a wrapper: the toolbar's sticky range ends
       at the textarea's end, so it stops above the bottom bar instead of
       sliding over it. The card clips, so the bars need no corner rounding
       of their own (square while stuck, rounded at rest). -->
  <div class="flex w-full flex-col">
    <EditorToolbar scroll sticky={!compact}>
      {#snippet leading()}
        <ToolbarButton
          label={m.editor_heading()}
          active={active.heading}
          onclick={() => run(cycleHeading)}
        >
          <Heading class="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={m.editor_ulist()}
          active={active.bullet}
          onclick={() => run(toggleBullet)}
        >
          <List class="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={m.editor_olist()}
          active={active.numbered}
          onclick={() => run(toggleNumbered)}
        >
          <ListOrdered class="size-4" />
        </ToolbarButton>

        <span class="bg-border mx-1 h-5 w-px shrink-0"></span>

        <ToolbarButton
          label={m.editor_bold()}
          shortcut="Mod-B"
          active={active.bold}
          onclick={() => run(toggleBold)}
        >
          <Bold class="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={m.editor_italic()}
          shortcut="Mod-I"
          active={active.italic}
          onclick={() => run(toggleItalic)}
        >
          <Italic class="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={m.editor_strikethrough()}
          shortcut="Mod-Shift-X"
          active={active.strike}
          onclick={() => run(toggleStrike)}
        >
          <Strikethrough class="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={m.editor_inlinecode()}
          shortcut="Mod-E"
          active={active.code}
          onclick={() => run(toggleInlineCode)}
        >
          <Code class="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={m.editor_codeblock()}
          onclick={() => run(toggleCodeBlock)}
        >
          <SquareCode class="size-4" />
        </ToolbarButton>

        <span class="bg-border mx-1 h-5 w-px shrink-0"></span>

        <ToolbarButton
          label={m.editor_link()}
          shortcut="Mod-K"
          onclick={() => run(insertLink)}
        >
          <Link class="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label={m.editor_table()}
          onclick={() => run(insertTable)}
        >
          <Table class="size-4" />
        </ToolbarButton>
      {/snippet}
      {#snippet trailing()}
        {@render pageActions?.()}
      {/snippet}
    </EditorToolbar>

    <Textarea
      class="{FIELD_BG} focus-visible:border-border {compact
        ? 'min-h-[12rem]'
        : 'min-h-[24rem]'} resize-y rounded-none border-0 text-sm focus-visible:ring-0"
      {placeholder}
      bind:value
      bind:ref={textarea}
      onkeydown={onKeydown}
      onkeyup={refresh}
      onselect={refresh}
      onclick={refresh}
      oninput={refresh}
      spellcheck={false}
      {...restProps}
    />
  </div>

  <div
    class="bg-muted-background text-muted-foreground flex h-11 items-center justify-between border-t px-4 text-xs"
  >
    <span>{words} {m.editor_words()}, {chars} {m.editor_chars()}</span>
    <a
      target="_blank"
      rel="noreferrer"
      class="text-muted-foreground flex items-center gap-1 no-underline"
      href="https://typst.app/docs/"
    >
      <FileText class="h-4 w-4" />
      {m.actic_typst_help()}
    </a>
  </div>
</div>
