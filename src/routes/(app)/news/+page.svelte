<script lang="ts">
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import NewsSearch from "./NewsSearch.svelte";
  import { Button } from "$lib/components/ui/button";
  import Pagination from "$lib/components/Pagination.svelte";
  import ArticleCard from "$lib/components/ArticleCard.svelte";
  import { isAuthorized } from "$lib/utils/authorization";
  import apiNames from "$lib/utils/apiNames";
  import dayjs from "dayjs";

  let { data } = $props();
</script>

<SetPageTitle title={m.news()} />
<SEO
  data={{
    type: "website",
    props: {
      title: "D-sektionen",
      description: m.landing_intro(),
    },
  }}
/>

<div class="flex flex-row gap-2 pt-4 pb-2">
  <div class="flex-1 gap-2 md:flex-row md:items-end">
    <NewsSearch />
  </div>
  {#if isAuthorized(apiNames.NEWS.CREATE, data.user)}
    <a href="/news/create"><Button>+ {m.news_create()}</Button></a>
  {/if}
</div>

{#if data.scheduledArticles.length > 0}
  <section class="mb-6">
    <h2 class="mb-3 text-lg font-semibold">{m.news_scheduledNews()}</h2>
    <div class="flex flex-col gap-2">
      {#each data.scheduledArticles as article (article.id)}
        <a
          href="/news/{article.slug}/edit"
          class="hover:bg-muted/50 flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors"
        >
          <span class="font-medium">{article.headerSv}</span>
          <span class="text-muted-foreground ml-4 shrink-0">
            {m.news_scheduledFor()}
            {dayjs(article.publishedAt).format("YYYY-MM-DD HH:mm")}
          </span>
        </a>
      {/each}
    </div>
  </section>
{/if}

<Pagination pageCount={data.pageCount} class="pb-2" />
<div class="space-y-4">
  <section class="grid grid-cols-1 gap-8 md:grid-cols-2">
    {#each data.articles as article, index (article.id)}
      <ArticleCard {article} {index} />
    {/each}
  </section>
  <Pagination pageCount={data.pageCount} />
</div>
