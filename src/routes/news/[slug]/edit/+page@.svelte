<script lang="ts">
  import { page } from "$app/stores";
  import ArticleEditor from "../../ArticleEditor.svelte";

  export let data;
</script>

<svelte:head>
  <title>Redigera nyhet | D-sektionen</title>
</svelte:head>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form}
  redirectUrl="/news/{$page.params.slug}"
/>
