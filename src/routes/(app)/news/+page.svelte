<script lang="ts">
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import NewsCard from "$lib/components/NewsCard.svelte";
  import NewsSearch from "./NewsSearch.svelte";
  import { Button } from "$lib/components/ui/button";
  import Pagination from "$lib/components/Pagination.svelte";

  let { data } = $props();

  let form: HTMLFormElement | undefined = $state();
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

<div class="flex flex-row gap-2 py-4">
  <form
    method="get"
    class="form-control flex-1 gap-2 md:flex-row md:items-end"
    id="filter-form"
    bind:this={form}
  >
    <NewsSearch />
  </form>
  <Button>+ Skapa</Button>
</div>
<div class="space-y-4">
  <section class="grid grid-cols-1 gap-8 md:grid-cols-2">
    {#each data.articles as article, index (article.id)}
      <NewsCard {article} {index} />
    {/each}
  </section>
  <Pagination />
</div>
