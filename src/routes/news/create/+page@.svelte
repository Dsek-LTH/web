<script lang="ts">
  import ArticleEditor from "../ArticleEditor.svelte";

  // import Tiptap from "$lib/TipTap.svelte";
  export let data;
  export let form;
</script>

<svelte:head>
  <title>Skapa nyhet | D-sektionen</title>
</svelte:head>

<ArticleEditor {...data} formData={form?.data}>
  <div slot="error">
    {#if form?.error}
      <p class="text-error">{form.error}</p>
    {/if}
  </div>
</ArticleEditor>
