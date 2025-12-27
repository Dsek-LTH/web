<script lang="ts">
  import ArticleEditor from "../ArticleEditor.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<ArticleEditor
  data={data.form}
  authorOptions={data.authorOptions}
  allTags={data.allTags}
  isCreating={true}
/>
