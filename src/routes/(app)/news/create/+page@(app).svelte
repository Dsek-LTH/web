<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import ArticleEditor from "../ArticleEditor.svelte";
  import * as m from "$paraglide/messages";

  export let data;
</script>

<SetPageTitle title={m.news_createArticle()} />

<ArticleEditor
  data={data.form}
  allTags={data.allTags}
  authorOptions={data.authorOptions}
/>
