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
    cycleHeader,
    insertLink,
    insertImage,
    toggleInlineCode,
    toggleFencedCode,
    insertTable,
    toggleQuote,
    toggleSeparator,
    toggleUList,
    toggleOList,
    toggleTaskList,
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
            cycleHeader(textarea);
            countChar();
          }}><title>{m.editor_heading()}</title></Heading
        >
        <Bold
          aria-label={m.editor_bold()}
          role="button"
          onclick={() => {
            toggleBold(textarea);
            countChar();
          }}><title>{m.editor_bold()}</title></Bold
        >
        <Italic
          aria-label={m.editor_italic()}
          role="button"
          onclick={() => {
            toggleItalic(textarea);
            countChar();
          }}><title>{m.editor_italic()}</title></Italic
        >
        <Strikethrough
          aria-label={m.editor_strikethrough()}
          role="button"
          onclick={() => {
            toggleStrikethrough(textarea);
            countChar();
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
            insertImage(textarea);
            countChar();
          }}><title>{m.editor_image()}</title></Image
        >

        <Link
          aria-label={m.editor_link()}
          role="button"
          onclick={() => {
            insertLink(textarea);
            countChar();
          }}><title>{m.editor_link()}</title></Link
        >
        <Code
          aria-label={m.editor_inlinecode()}
          role="button"
          onclick={() => {
            toggleInlineCode(textarea);
            countChar();
          }}><title>{m.editor_inlinecode()}</title></Code
        >
        <SquareCode
          aria-label={m.editor_codeblock()}
          role="button"
          onclick={() => {
            toggleFencedCode(textarea);
            countChar();
          }}><title>{m.editor_codeblock()}</title></SquareCode
        >
        <Table
          aria-label={m.editor_table()}
          role="button"
          onclick={() => {
            insertTable(textarea);
            countChar();
          }}><title>{m.editor_table()}</title></Table
        >
        <TextQuote
          aria-label={m.editor_quote()}
          role="button"
          onclick={() => {
            toggleQuote(textarea);
            countChar();
          }}><title>{m.editor_quote()}</title></TextQuote
        >
        <Minus
          aria-label={m.editor_separator()}
          role="button"
          onclick={() => {
            toggleSeparator(textarea);
            countChar();
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
            toggleUList(textarea);
            countChar();
          }}><title>{m.editor_ulist()}</title></List
        >
        <ListOrdered
          aria-label={m.editor_olist()}
          role="button"
          onclick={() => {
            toggleOList(textarea);
            countChar();
          }}><title>{m.editor_olist()}</title></ListOrdered
        >
        <ListTodo
          aria-label={m.editor_tasklist()}
          role="button"
          onclick={() => {
            toggleTaskList(textarea);
            countChar();
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
