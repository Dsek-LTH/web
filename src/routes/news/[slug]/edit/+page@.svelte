<script lang="ts">
  import { page } from "$app/stores";
  import ArticleEditor from "$lib/components/ArticleEditor.svelte";

  export let data;
  export let form;
</script>

<ArticleEditor {...data}>
  <input slot="form-end" type="hidden" value={$page.params.slug} name="slug" />
  <div slot="error">
    {#if form?.error}
      <p class="text-error">{form.error}</p>
    {/if}
  </div>
</ArticleEditor>
