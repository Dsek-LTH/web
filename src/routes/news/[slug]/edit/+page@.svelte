<script lang="ts">
  import { page } from "$app/stores";
  import ArticleEditor from "../../ArticleEditor.svelte";

  export let data;
  export let form;
</script>

<ArticleEditor
  selectedTags={data.article.tags}
  selectedAuthorOption={data.article.author}
  {...data}
  formData={form?.data}
>
  <input slot="form-end" type="hidden" value={$page.params.slug} name="slug" />
  <div slot="error">
    {#if form?.error}
      <p class="text-error">{form.error}</p>
    {/if}
  </div>
</ArticleEditor>
