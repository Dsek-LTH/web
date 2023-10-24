<script lang="ts">
  import Article from "../Article.svelte";

  export let data;
  $: article = data.article;
</script>

<Article
  {article}
  member={article.author.member}
  position={article.author.mandate?.position}
  tags={article.tags}
>
  <div slot="actions">
    <a class="text-primary hover:underline" href={`/news/${article.slug}/edit`}> Redigera </a>
  </div>
</Article>
