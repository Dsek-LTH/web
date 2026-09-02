<script lang="ts">
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import NewsSearch from "./NewsSearch.svelte";
  import { Button } from "$lib/components/ui/button";
  import Pagination from "$lib/components/Pagination.svelte";
  import ArticleCard from "$lib/components/ArticleCard.svelte";

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
  <!-- Go's mock auth currently authorizes every request as if creating were
       always allowed (see backend/CLAUDE.md's Auth section) - this button
       is unconditional to match, rather than gating on the SvelteKit-side
       Keycloak session this feature no longer reads. -->
  <a href="/news/create"><Button>+ {m.news_create()}</Button></a>
</div>
<Pagination pageCount={data.pageCount} class="pb-2" />
<div class="space-y-4">
  <section class="grid grid-cols-1 gap-8 md:grid-cols-2">
    {#each data.articles as article, index (article.id)}
      <ArticleCard {article} {index} />
    {/each}
  </section>
  <Pagination pageCount={data.pageCount} />
</div>
