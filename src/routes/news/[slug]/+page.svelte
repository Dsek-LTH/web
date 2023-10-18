<script lang="ts">
  import Article from "../Article.svelte";

  export let data;
  $: article = data.article;
</script>

<Article {article}>
  <div slot="actions">
    {#if data.canEdit}
      <a class="text-primary hover:underline" href={`/news/${article.slug}/edit`}> Redigera </a>
    {/if}
  </div>
</Article>
