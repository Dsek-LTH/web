<!-- <script lang="ts">
  import SmallArticleCard from "../news/SmallArticleCard.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
  let year: number | null = new Date().getFullYear();
</script>

<h1>Epic</h1>

<p>Mest gillade artiklarna från {year}</p>

{#each data.mostLikedArticles as article (article.id)}
  <SmallArticleCard
    {article}
    author={article.author}
    tags={article.tags}
    likers={article.likers}
    commentCount={article.comments.length}
    likeForm={data.likeForm}
    hideBody
  />
{/each} -->
