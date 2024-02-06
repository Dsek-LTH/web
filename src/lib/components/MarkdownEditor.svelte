<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import { Markdown } from "tiptap-markdown";
  export let value = "";

  let element: Element | undefined = undefined;
  let editor: Editor | undefined = undefined;

  onMount(() => {
    editor = new Editor({
      element: element,
      extensions: [StarterKit, Markdown],
      content: value,
      onTransaction: () => {
        editor = editor;
      },
      onUpdate: () => {
        value = editor?.storage["markdown"].getMarkdown();
      },
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
</script>

<div class="join">
  <button
    type="button"
    class="btn join-item"
    on:click={() => {
      editor?.chain().focus().toggleBold().run();
    }}><b>B</b></button
  >
  <button
    type="button"
    class="btn join-item"
    on:click={() => {
      editor?.chain().focus().toggleHeading({ level: 1 }).run();
    }}>H</button
  >
  <button
    type="button"
    class="btn join-item"
    on:click={() => {
      editor?.chain().focus().toggleItalic().run();
    }}><it>I</it></button
  >
  <button
    type="button"
    class="btn join-item"
    on:click={() => {
      editor?.chain().focus().toggleStrike().run();
    }}><s>S</s></button
  >
</div>
<!--
  The ignores below allows are neccessary since we create a "fake" Daisy UI textbox.
  So when a user presses a part of the screen that is part of the fake one, we have to
  send the event to the real one.
-->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  on:click={() => {
    editor?.view.dom.focus();
  }}
  class="textarea textarea-bordered min-h-[10rem]"
  bind:this={element}
/>
