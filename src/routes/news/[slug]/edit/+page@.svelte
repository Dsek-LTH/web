<script lang="ts">
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
/>
