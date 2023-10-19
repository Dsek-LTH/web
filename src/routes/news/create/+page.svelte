<script lang="ts">
  import ArticleEditor from "../components/ArticleEditor.svelte";

  // import Tiptap from "$lib/TipTap.svelte";
  export let data;
  export let form;
</script>

<ArticleEditor {...data} formData={form?.data}>
  <div slot="error">
    {#if form?.error}
      <p class="text-error">{form.error}</p>
    {/if}
  </div>
</ArticleEditor>
