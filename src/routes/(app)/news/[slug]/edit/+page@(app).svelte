<script lang="ts">
  import ArticleEditor from "../../ArticleEditor.svelte";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>{m.news_editArticle()} | D-sektionen</title>
</svelte:head>

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form}
/>
