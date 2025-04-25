<script lang="ts">
  import FormCheckbox from "$lib/components/forms/FormCheckbox.svelte";
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import type { SuperForm, SuperValidated } from "sveltekit-superforms";
  import ArticleEditor from "../ArticleEditor.svelte";
  import type { ArticleSchema } from "$lib/news/schema";

  let { data } = $props();

  const superform = superForm(data.form, {
    dataType: "json",
  });
  let form = $derived(data.form as unknown as SuperValidated<ArticleSchema>);
  let superformCorrectType = $derived(
    superform as unknown as SuperForm<ArticleSchema>,
  );
</script>

<SetPageTitle title={m.news_createArticle()} />

<ArticleEditor
  superform={superformCorrectType}
  data={form}
  allTags={data.allTags}
  authorOptions={data.authorOptions}
>
  <!-- @migration-task: migrate this slot by hand, `form-end` is an invalid identifier -->
  <div slot="form-end">
    <FormInput
      {superform}
      field="notificationText"
      label="Notistext"
      explanation="Texten som visas i notisen, om tom kommer det vara början av nyhetstexten"
    />
    <FormCheckbox {superform} field="sendNotification" label="Skicka notis?" />
  </div>
</ArticleEditor>
