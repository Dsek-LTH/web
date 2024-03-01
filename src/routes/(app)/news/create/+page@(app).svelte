<script lang="ts">
  import ArticleEditor from "../ArticleEditor.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>Skapa nyhet | D-sektionen</title>
</svelte:head>

<ArticleEditor
  data={data.form}
  allTags={data.allTags}
  authorOptions={data.authorOptions}
/>
