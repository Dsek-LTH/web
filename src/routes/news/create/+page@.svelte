<script lang="ts">
  import ArticleEditor from "../ArticleEditor.svelte";

  export let data;
</script>

<svelte:head>
  <title>Skapa nyhet | D-sektionen</title>
</svelte:head>

<ArticleEditor data={data.form} allTags={data.allTags} authorOptions={data.authorOptions} />
