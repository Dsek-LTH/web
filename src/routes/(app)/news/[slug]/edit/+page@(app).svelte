<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import ArticleEditor from "../../ArticleEditor.svelte";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<SetPageTitle title={m.news_editArticle()} />

<ArticleEditor
  allTags={data.allTags}
  authorOptions={data.authorOptions}
  data={data.form}
/>
