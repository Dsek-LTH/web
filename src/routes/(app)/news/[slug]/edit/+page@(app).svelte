<script lang="ts">
  import ArticleEditor from "../../ArticleEditor.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>Redigera nyhet | D-sektionen</title>
</svelte:head>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form}
/>
