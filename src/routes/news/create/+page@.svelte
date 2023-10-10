<script lang="ts">
  import ArticleEditor from "$lib/components/ArticleEditor.svelte";

  // import Tiptap from "$lib/TipTap.svelte";
  export let data;
  export let form;
</script>

<ArticleEditor {...data}>
  <div slot="error">
    {#if form?.error}
      <p class="text-error">{form.error}</p>
    {/if}
  </div>
</ArticleEditor>
