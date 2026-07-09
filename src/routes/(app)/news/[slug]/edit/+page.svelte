<script lang="ts">
  import ArticleEditor from "../../ArticleEditor.svelte";
  import type { PageData } from "./$types";
  import { superForm } from "$lib/utils/client/superForms";
  import type { ArticleSchema } from "$lib/news/schema";
  import type { SuperForm } from "sveltekit-superforms";

  let { data }: { data: PageData } = $props();

  // svelte-ignore state_referenced_locally
  const superform = superForm(data.form, {
    dataType: "json",
    delayMs: 500,
  });
</script>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form}
  superform={superform as unknown as SuperForm<ArticleSchema>}
  committees={data.committees}
/>
