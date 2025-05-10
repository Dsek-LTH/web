<script lang="ts">
  import { page } from "$app/stores";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import apiNames from "$lib/utils/apiNames";
  import type { Tag } from "@prisma/client";
  import { isAuthorized } from "$lib/utils/authorization";
  import SmallArticleCard from "./SmallArticleCard.svelte";
  import * as m from "$paraglide/messages";
  export let data: PageData;

  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  let filteredTags: Tag[] = data.allTags.filter((tag) =>
    $page.url.searchParams.getAll("tags").includes(tag.name),
  );

  let form: HTMLFormElement;
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
  image={{
    url: "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/guild/d_sektionen/full/color.svg",
    mime_type: "image/svg+xml",
    width: 400,
    height: 400,
    alt: "D-sektionen logo",
  }}
/>

<div class="space-y-4">
  <section>
    <form
      method="get"
      class="form-control flex-1 gap-2 md:flex-row md:items-end"
      id="filter-form"
      bind:this={form}
    >
      <TagSelector
        allTags={data.allTags}
        bind:selectedTags={filteredTags}
        onChange={() => setTimeout(() => form.requestSubmit())}
      />
      <SearchBar />
      {#each filteredTags as tag (tag.id)}
        <input type="hidden" name="tags" value={tag.name} />
      {/each}
      {#if isAuthorized(apiNames.TAGS.CREATE, data.user) || isAuthorized(apiNames.TAGS.UPDATE, data.user)}
        <a class="btn" href="/news/tags">{m.news_tags()}</a>
      {/if}
      {#if isAuthorized(apiNames.NEWS.CREATE, data.user)}
        <a class="btn btn-primary" href="/news/create">+ {m.news_create()}</a>
      {/if}
    </form>
  </section>

  <section class="grid grid-cols-1 gap-8 md:grid-cols-2">
    {#each data.articles as article (article.id)}
      <SmallArticleCard {article} />
    {/each}
  </section>

  <Pagination count={data.pageCount} />
</div>
