<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import ArticleEditor from "../../ArticleEditor.svelte";
  import * as m from "$paraglide/messages";
  import { superForm } from "$lib/utils/client/superForms";
  import type { SuperForm } from "sveltekit-superforms";

  import type { PageData } from "./$types";
  import FormDateInput from "$lib/components/forms/FormDateInput.svelte";
  import type { ArticleSchema } from "$lib/news/schema";
  export let data: PageData;

  const superform = superForm(data.form, {
    dataType: "json",
  });
  $: superformCorrectType = superform as unknown as SuperForm<ArticleSchema>;

  const publishTime = data.form.data.publishTime ?? new Date(0);
  const isPublished = publishTime < new Date();
</script>

<SetPageTitle title={m.news_editArticle()} />

{#if isPublished}
  <ArticleEditor
    allTags={data.allTags}
    authorOptions={data.authorOptions}
    data={data.form}
  />
{:else}
  <ArticleEditor
    allTags={data.allTags}
    authorOptions={data.authorOptions}
    data={data.form}
  >
    <div slot="form-end">
      <FormDateInput
        superform={superformCorrectType}
        field="publishTime"
        label="Schemalägg publicering"
      />
    </div>
  </ArticleEditor>
{/if}
