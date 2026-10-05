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
  import Minus from "@lucide/svelte/icons/minus";
  import FileText from "@lucide/svelte/icons/file-text";
  import * as m from "$paraglide/messages";
  import type { WithoutChildren, WithElementRef } from "bits-ui";
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import {
    cycleHeading,
    dedent,
    indent,
    insertLine,
    insertLink,
    insertTable,
    isWrapped,
    lineHasHeading,
    lineHasPrefix,
    toggleBold,
    toggleBullet,
    toggleCodeBlock,
    toggleInlineCode,
    toggleItalic,
    toggleNumbered,
    toggleStrike,
  } from "./typst-commands";

  let {
    value = $bindable(""),
    placeholder = "",
    trailing,
    ...restProps
  }: {
    value?: string;
    placeholder?: string;
    trailing?: Snippet;
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
</script>

<div class="border-border flex w-full flex-col rounded-lg border">
  <div
    class="bg-muted-background text-muted-foreground flex h-11 items-center gap-0.5 rounded-t-lg border-b px-1.5"
  >
    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      class:text-foreground={active.heading}
      aria-label={m.actic_tool_heading()}
      title={m.actic_tool_heading()}
      onclick={() => run(cycleHeading)}
    >
      <Heading class="size-4" />
    </button>
    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      class:text-foreground={active.bullet}
      aria-label={m.actic_tool_bullet()}
      title={m.actic_tool_bullet()}
      onclick={() => run(toggleBullet)}
    >
      <List class="size-4" />
    </button>
    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      class:text-foreground={active.numbered}
      aria-label={m.actic_tool_numbered()}
      title={m.actic_tool_numbered()}
      onclick={() => run(toggleNumbered)}
    >
      <ListOrdered class="size-4" />
    </button>

    <span class="bg-border mx-1 h-5 w-px"></span>

    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      class:text-foreground={active.bold}
      aria-label={m.actic_tool_bold()}
      title={`${m.actic_tool_bold()} (Ctrl+B)`}
      onclick={() => run(toggleBold)}
    >
      <Bold class="size-4" />
    </button>
    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      class:text-foreground={active.italic}
      aria-label={m.actic_tool_italic()}
      title={`${m.actic_tool_italic()} (Ctrl+I)`}
      onclick={() => run(toggleItalic)}
    >
      <Italic class="size-4" />
    </button>
    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      class:text-foreground={active.strike}
      aria-label={m.actic_tool_strike()}
      title={`${m.actic_tool_strike()} (Ctrl+Shift+X)`}
      onclick={() => run(toggleStrike)}
    >
      <Strikethrough class="size-4" />
    </button>
    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      class:text-foreground={active.code}
      aria-label={m.actic_tool_code()}
      title={`${m.actic_tool_code()} (Ctrl+E)`}
      onclick={() => run(toggleInlineCode)}
    >
      <Code class="size-4" />
    </button>
    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      aria-label={m.actic_tool_codeblock()}
      title={m.actic_tool_codeblock()}
      onclick={() => run(toggleCodeBlock)}
    >
      <SquareCode class="size-4" />
    </button>

    <span class="bg-border mx-1 h-5 w-px"></span>

    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      aria-label={m.actic_tool_link()}
      title={`${m.actic_tool_link()} (Ctrl+K)`}
      onclick={() => run(insertLink)}
    >
      <Link class="size-4" />
    </button>
    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      aria-label={m.actic_tool_table()}
      title={m.actic_tool_table()}
      onclick={() => run(insertTable)}
    >
      <Table class="size-4" />
    </button>
    <button
      type="button"
      class="hover:bg-accent hover:text-foreground rounded p-2"
      aria-label={m.actic_tool_line()}
      title={m.actic_tool_line()}
      onclick={() => run(insertLine)}
    >
      <Minus class="size-4" />
    </button>

    {#if trailing}
      <div class="ml-auto">{@render trailing()}</div>
    {/if}
  </div>

  <Textarea
    class="{FIELD_BG} focus-visible:border-border min-h-[16rem] resize-y rounded-none border-0 text-sm focus-visible:ring-0"
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

  <div
    class="bg-muted-background text-muted-foreground flex h-11 items-center justify-between rounded-b-lg border-t px-4 text-xs"
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
