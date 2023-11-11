<script lang="ts">
  export let data;
  import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
  let markdown = data.markdown?.markdown;
</script>

<div class="p-2 text-neutral-content">
  <form method="POST">
    <MarkdownEditor bind:value={markdown} />
    <input type="hidden" name="name" value={data.slug} />
    <input type="hidden" name="markdown" bind:value={markdown} />
    <button class="btn" type="submit">Submit</button>
  </form>
</div>
