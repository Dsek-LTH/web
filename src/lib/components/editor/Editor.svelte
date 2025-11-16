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

  let textarea: HTMLTextAreaElement | null = $state(null);
  let chars = $state(0);
  let words = $state(0);

  let {
    value = "",
    placeholder = "Enter text here...",
    ...restProps
  }: { value: string | null; placeholder: string } = $props();

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
    } else {
      const before = value?.substring(0, textarea.selectionStart);
      const after = value?.substring(textarea.selectionStart, value?.length);
      value = before + add + add + after;
      newpos = textarea.selectionStart + add.length;
    }
    textarea.focus();
    setTimeout(() => {
      textarea?.setSelectionRange(newpos, newpos);
    }, 0);
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
    const begin = rowIndexes.pop();
    if (begin == 0) {
      value = add + " " + value;
    } else {
      let before = value.substring(0, (begin ?? 0) + 1);
      let after = value.substring((begin ?? 0) + 1, value.length);
      value = before + add + " " + after;
    }

    const newpos = sel + 2;
    textarea.focus();
    console.log(textarea);
    setTimeout(() => {
      textarea?.setSelectionRange(newpos, newpos);
    }, 0);
    countChar();
  }
</script>

<div
  class="border-border flex w-[640px] flex-col rounded-lg border-[1px] border-solid"
>
  <div
    class="bg-muted-background *:text-muted-foreground flex h-12 flex-row rounded-t-lg"
  >
    <div
      class="border-border flex flex-row items-center justify-between border-r-[1px] *:mx-[12px] *:size-4 *:cursor-pointer"
    >
      <Heading
        aria-label="Heading"
        role="button"
        onclick={() => {
          addMdPrepend("#");
        }}><title>Heading</title></Heading
      >
      <Bold
        aria-label="Bold"
        role="button"
        onclick={() => {
          addMdOutline("**");
        }}><title>Bold</title></Bold
      >
      <Italic
        aria-label="Italic"
        role="button"
        onclick={() => {
          addMdOutline("*");
        }}><title>Italic</title></Italic
      >
      <Strikethrough
        aria-label="Strikethrough"
        role="button"
        onclick={() => {
          addMdOutline("~~");
        }}><title>Strikethrough</title></Strikethrough
      >
    </div>
    <div
      class="border-border flex flex-row items-center justify-between border-r-[1px] *:mx-[12px] *:size-4 *:cursor-pointer"
    >
      <Image
        aria-label="Image"
        role="button"
        onclick={() => {
          addMdAfter("![Image title](https://image url here)");
        }}><title>Image</title></Image
      >

      <Link
        aria-label="Link"
        role="button"
        onclick={() => {
          addMdAfter("[Example](https://example.com)");
        }}><title>Link</title></Link
      >
      <Code
        aria-label="Inline code"
        role="button"
        onclick={() => {
          addMdOutline("`");
        }}><title>Inline code</title></Code
      >
      <SquareCode
        aria-label="Code block"
        role="button"
        onclick={() => {
          addMdOutline("```\n\n");
        }}><title>Code block</title></SquareCode
      >
      <Table
        aria-label="Table"
        role="button"
        onclick={() => {
          addMdAfter(`| Label      | Data |
| ----------- | ----------- |
| One      | Three           |
| Two      | Four       |`);
        }}><title>Table</title></Table
      >
      <TextQuote
        aria-label="Quote"
        role="button"
        onclick={() => {
          addMdPrepend(">");
        }}><title>Quote</title></TextQuote
      >
      <Minus
        aria-label="Separator"
        role="button"
        onclick={() => {
          addMdPrepend("***");
        }}><title>Horizontal separator</title></Minus
      >
    </div>
    <div
      class="border-border flex flex-row items-center justify-between border-r-[1px] *:mx-[12px] *:size-4 *:cursor-pointer"
    >
      <List
        aria-label="Unordered list"
        role="button"
        onclick={() => {
          addMdAfter("- one\n- two\n- three");
        }}><title>Unordered list</title></List
      >
      <ListOrdered
        aria-label="Ordered list"
        role="button"
        onclick={() => {
          addMdAfter("1. one\n2. two\n3. three");
        }}><title>Ordered list</title></ListOrdered
      >
      <ListTodo
        aria-label="Todo list"
        role="button"
        onclick={() => {
          addMdAfter("- [x] one\n- [ ] two\n- [ ] three");
        }}><title>Todo list</title></ListTodo
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
