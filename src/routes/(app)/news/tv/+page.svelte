<script lang="ts">
  import ArticleCard from "$lib/components/ArticleCard.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages.js";

  let { data } = $props();

  const ROTATE_MS = 15_000;
  let current = $state(0);

  $effect(() => {
    if (data.articles.length <= 1) return;
    const interval = setInterval(() => {
      current = (current + 1) % data.articles.length;
    }, ROTATE_MS);
    return () => clearInterval(interval);
  });
</script>

<SetPageTitle title={m.news_tv()} />

<div class="bg-background flex min-h-screen items-center justify-center p-8">
  {#if data.articles.length === 0}
    <p class="text-muted-foreground text-2xl">{m.news_tv_noArticles()}</p>
  {:else}
    {#each data.articles as article, index (article.id)}
      {#if index === current}
        <div class="w-full max-w-3xl">
          <ArticleCard {article} {index} />
        </div>
      {/if}
    {/each}
    {#if data.articles.length > 1}
      <div class="fixed bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
        {#each data.articles as article, index (article.id)}
          <div
            class="h-2 w-2 rounded-full transition-colors"
            class:bg-primary={index === current}
            class:bg-muted={index !== current}
          ></div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
