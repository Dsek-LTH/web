<script lang="ts">
  import { Textarea } from "$lib/components/ui/textarea";
  import Heading from "@lucide/svelte/icons/heading";
  import Bold from "@lucide/svelte/icons/bold";
  import Italic from "@lucide/svelte/icons/italic";
  import Strikethrough from "@lucide/svelte/icons/strikethrough";
  import Image from "@lucide/svelte/icons/image";
  import Link from "@lucide/svelte/icons/link";
  import Code from "@lucide/svelte/icons/code";
  import SquareCode from "@lucide/svelte/icons/square-code";
  import Table from "@lucide/svelte/icons/table";
  import TextQuote from "@lucide/svelte/icons/text-quote";
  import Minus from "@lucide/svelte/icons/minus";
  import List from "@lucide/svelte/icons/list";
  import ListOrdered from "@lucide/svelte/icons/list-ordered";
  import ListTodo from "@lucide/svelte/icons/list-todo";

  import * as m from "$paraglide/messages";
  import type { WithoutChildren, WithElementRef } from "bits-ui";
  import type { HTMLTextareaAttributes } from "svelte/elements";
  import { onMount } from "svelte";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import {
    toggleItalic,
    toggleBold,
    toggleStrikethrough,
  } from "./textareacommands";

  let textarea: HTMLTextAreaElement | null = $state(null);
  let chars = $state(0);
  let words = $state(0);

  let {
    value = $bindable(""),
    placeholder = "Enter text here...",
    ...restProps
  }: {
    value?: string;
    placeholder?: string;
  } & WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();

  function countChar() {
    chars = value?.length ?? 0;
    words = chars == 0 ? 0 : value!.split(/\s+/).length;
  }

  function addMdAfter(add: string) {
    if (textarea == null) {
      return;
    }
    const before = value?.substring(0, textarea.selectionStart);
    const after = value?.substring(textarea.selectionEnd, value.length);
    value = before + add + after;
    textarea.focus();
    const newpos = textarea.selectionStart + add.length;
    setTimeout(() => {
      textarea?.setSelectionRange(newpos, newpos);
    }, 0);
    countChar();
  }

  function addMdOutline(add: string) {
    if (textarea == null) {
      return;
    }
    let newpos: number;
    const originStart = textarea.selectionStart;
    const originEnd = textarea.selectionEnd;
    if (textarea.selectionStart != textarea.selectionEnd) {
      const before = value?.substring(0, textarea.selectionStart);
      const selection = value?.substring(
        textarea.selectionStart,
        textarea.selectionEnd,
      );
      const after = value?.substring(textarea.selectionEnd, value.length);
      value = before + add + selection + add + after;
      newpos =
        textarea.selectionStart +
        add.length * 2 +
        textarea.selectionEnd -
        textarea.selectionStart;
      textarea.focus();
      setTimeout(() => {
        textarea?.setSelectionRange(
          originStart + add.length,
          originEnd + add.length,
          "forward",
        );
      }, 0);
    } else {
      const before = value?.substring(0, textarea.selectionStart);
      const after = value?.substring(textarea.selectionStart, value?.length);
      value = before + add + add + after;
      newpos = textarea.selectionStart + add.length;
      textarea.focus();
      setTimeout(() => {
        console.log("this does not happen");
        textarea?.setSelectionRange(newpos, newpos);
      }, 0);
    }

    countChar();
  }

  function addMdPrepend(add: string) {
    if (textarea == null) {
      return;
    }
    const sel = textarea.selectionStart;
    let rowIndexes = [0];
    if (value == null) {
      return;
    } else {
      for (let i = 0; i < value?.length; i++) {
        if (value[i] == "\n") {
          rowIndexes.push(i);
        }
      }
    }
    rowIndexes = rowIndexes.filter((e) => e < sel);
    if (rowIndexes.length == 0) {
      rowIndexes.push(0);
    }
    const begin = rowIndexes.pop();
    if (begin == 0) {
      value = add + " " + value;
    } else {
      let before = value.substring(0, (begin ?? 0) + 1);
      let after = value.substring((begin ?? 0) + 1, value.length);
      value = before + add + " " + after;
    }

    const newpos = sel + add.length + 1;
    textarea.focus();
    setTimeout(() => {
      textarea?.setSelectionRange(newpos, newpos);
    }, 0);
    countChar();
  }

  onMount(() => {
    countChar();
  });
</script>

<div class="flex flex-col">
  <div
    class="border-border flex w-full flex-col rounded-lg border-[1px] border-solid"
  >
    <div
      style=""
      class="bg-muted-background *:text-muted-foreground after:to-[rgba(0, 0, 0, 1)] after:from-accent flex h-12 flex-row overflow-scroll rounded-t-lg after:sticky after:right-0 after:bg-linear-to-l after:pl-10"
    >
      <div
        class="border-border flex flex-row items-center justify-between border-r-[1px] *:mx-[12px] *:size-4 *:cursor-pointer"
      >
        <Heading
          aria-label={m.editor_heading()}
          role="button"
          onclick={() => {
            addMdPrepend("#");
          }}><title>{m.editor_heading()}</title></Heading
        >
        <Bold
          aria-label={m.editor_bold()}
          role="button"
          onclick={() => {
            toggleBold(textarea);
          }}><title>{m.editor_bold()}</title></Bold
        >
        <Italic
          aria-label={m.editor_italic()}
          role="button"
          onclick={() => {
            toggleItalic(textarea);
          }}><title>{m.editor_italic()}</title></Italic
        >
        <Strikethrough
          aria-label={m.editor_strikethrough()}
          role="button"
          onclick={() => {
            toggleStrikethrough(textarea);
          }}><title>{m.editor_strikethrough()}</title></Strikethrough
        >
      </div>
      <div
        class="border-border flex flex-row items-center justify-between border-r-[1px] *:mx-[12px] *:size-4 *:cursor-pointer"
      >
        <Image
          aria-label={m.editor_image()}
          role="button"
          onclick={() => {
            addMdAfter("![Image title](https://image url here)");
          }}><title>{m.editor_image()}</title></Image
        >

        <Link
          aria-label={m.editor_link()}
          role="button"
          onclick={() => {
            addMdAfter("[Example](https://example.com)");
          }}><title>{m.editor_link()}</title></Link
        >
        <Code
          aria-label={m.editor_inlinecode()}
          role="button"
          onclick={() => {
            addMdOutline("`");
          }}><title>{m.editor_inlinecode()}</title></Code
        >
        <SquareCode
          aria-label={m.editor_codeblock()}
          role="button"
          onclick={() => {
            addMdOutline("```\n\n");
          }}><title>{m.editor_codeblock()}</title></SquareCode
        >
        <Table
          aria-label={m.editor_table()}
          role="button"
          onclick={() => {
            addMdAfter(`| Label      | Data |
| ----------- | ----------- |
| One      | Three           |
| Two      | Four       |`);
          }}><title>{m.editor_table()}</title></Table
        >
        <TextQuote
          aria-label={m.editor_quote()}
          role="button"
          onclick={() => {
            addMdPrepend(">");
          }}><title>{m.editor_quote()}</title></TextQuote
        >
        <Minus
          aria-label={m.editor_separator()}
          role="button"
          onclick={() => {
            addMdPrepend("***");
          }}><title>{m.editor_separator()}</title></Minus
        >
      </div>
      <div
        class="border-border flex flex-row items-center justify-between border-r-[1px] *:mx-[12px] *:size-4 *:cursor-pointer"
      >
        <List
          aria-label={m.editor_ulist()}
          role="button"
          onclick={() => {
            addMdAfter("- one\n- two\n- three");
          }}><title>{m.editor_ulist()}</title></List
        >
        <ListOrdered
          aria-label={m.editor_olist()}
          role="button"
          onclick={() => {
            addMdAfter("1. one\n2. two\n3. three");
          }}><title>{m.editor_olist()}</title></ListOrdered
        >
        <ListTodo
          aria-label={m.editor_tasklist()}
          role="button"
          onclick={() => {
            addMdAfter("- [x] one\n- [ ] two\n- [ ] three");
          }}><title>{m.editor_tasklist()}</title></ListTodo
        >
      </div>
    </div>
    <Textarea
      class="focus-visible:border-border h-[286px] resize-none rounded-none border-0 border-t-[1px] border-b-[1px] focus-visible:ring-0"
      {placeholder}
      onkeyup={() => countChar()}
      bind:value
      bind:ref={textarea}
      {...restProps}
    />
    <div
      class="bg-muted-background text-muted-foreground flex h-12 flex-row justify-between rounded-b-lg"
    >
      <div
        class="flex flex-row items-center justify-between rounded-bl-lg border-r-[1px] px-6 font-medium"
      >
        <span class=""
          >{words} {m.editor_words()}, {chars} {m.editor_chars()}</span
        >
      </div>
      <a
        target="_blank"
        class="text-muted-foreground flex flex-row items-center gap-1 rounded-br-lg border-l-[1px] px-6 no-underline"
        href="https://www.markdownguide.org/"
      >
        <svg
          role="img"
          fill="var(--muted-foreground)"
          height="16"
          width="16"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          ><title>Markdown</title><path
            d="M22.27 19.385H1.73A1.73 1.73 0 010 17.655V6.345a1.73 1.73 0 011.73-1.73h20.54A1.73 1.73 0 0124 6.345v11.308a1.73 1.73 0 01-1.73 1.731zM5.769 15.923v-4.5l2.308 2.885 2.307-2.885v4.5h2.308V8.078h-2.308l-2.307 2.885-2.308-2.885H3.46v7.847zM21.232 12h-2.309V8.077h-2.307V12h-2.308l3.461 4.039z"
          /></svg
        >
        <span class="">{m.editor_markdown_help()}</span>
      </a>
    </div>
  </div>
  {#if restProps["aria-errormessage"]}
    <p class="text-rosa-500 mt-1 text-xs font-semibold">
      <CircleAlert class="mb-[2px] inline h-[1rem] w-[1rem]" />
      {restProps["aria-errormessage"]}
    </p>
  {/if}
</div>
