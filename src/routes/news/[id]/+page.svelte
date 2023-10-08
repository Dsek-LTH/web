<script lang="ts">
  import Article from "$lib/components/Article.svelte";

  export let data;
  $: article = data.article!;
</script>

<Article {article} />
