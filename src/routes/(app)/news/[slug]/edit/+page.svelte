<script lang="ts">
  import ArticleEditor from "../../ArticleEditor.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form}
  committees={data.committees}
/>
