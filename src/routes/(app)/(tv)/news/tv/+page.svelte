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
      <div
        class="fixed bottom-8 left-1/2 flex w-full max-w-3xl -translate-x-1/2 gap-2 px-8"
      >
        {#each data.articles as article, index (article.id)}
          <div class="bg-muted h-1 flex-1 overflow-hidden rounded-full">
            {#if index < current}
              <div class="bg-primary h-full w-full"></div>
            {:else if index === current}
              {#key current}
                <div
                  class="bg-primary h-full w-0"
                  style="animation: tv-progress {ROTATE_MS}ms linear forwards;"
                ></div>
              {/key}
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  @keyframes -global-tv-progress {
    from {
      width: 0%;
    }
    to {
      width: 100%;
    }
  }
</style>
