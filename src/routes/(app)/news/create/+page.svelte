<script lang="ts">
  import { type SuperForm, type SuperValidated } from "sveltekit-superforms";
  import ArticleEditor from "../ArticleEditor.svelte";
  import type { PageData } from "./$types";
  import { type ArticleSchema } from "$lib/news/schema";
  import { superForm } from "$lib/utils/client/superForms";

  let { data }: { data: PageData } = $props();

  // svelte-ignore state_referenced_locally
  const superform = superForm(data.form, {
    dataType: "json",
    id: "createpage",
    delayMs: 500,
  });
</script>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form as unknown as SuperValidated<ArticleSchema>}
  superform={superform as unknown as SuperForm<ArticleSchema>}
  committees={data.committees}
/>
