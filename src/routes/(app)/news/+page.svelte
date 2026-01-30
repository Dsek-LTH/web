<script lang="ts">
  import { page } from "$app/stores";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import SmallArticleCard from "./SmallArticleCard.svelte";
  import * as m from "$paraglide/messages";
  export let data: PageData;

  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
  let filteredTags: Array<ExtendedPrismaModel<"Tag">> = data.allTags.filter(
    (tag) => $page.url.searchParams.getAll("tags").includes(tag.name),
  );

  let form: HTMLFormElement;
  const { scheduledArticles } = data;
  let showScheduled = false;
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
      {#if scheduledArticles.length > 0}
        <button
          class="btn btn-secondary"
          on:click={() => (showScheduled = !showScheduled)}
          >{`${!showScheduled ? m.news_show() : m.news_hide()} ${m.news_scheduled()}`}</button
        >
      {/if}
    </form>
  </section>

  {#if showScheduled}
    <section class="space-y-4 rounded-lg bg-base-200 p-4">
      <h2 class="text-xl font-semibold">{m.news_scheduledNews()}</h2>
      <div class="space-y-2">
        {#each scheduledArticles as article (article.id)}
          <div class="flex gap-4 rounded-lg bg-base-300 p-4">
            <div class=" flex flex-col items-center">
              <span class="text-3xl font-bold"
                >{article.publishedAt?.getDate()}</span
              >
              <span class="text-sm">
                {article.publishedAt
                  ? article.publishedAt.toLocaleString("default", {
                      month: "short",
                    })
                  : ""}
              </span>
            </div>
            <div class="flex-1">
              <h3 class="mb-2 text-lg font-semibold">{article.header}</h3>
              <p class="prose text-sm">
                {article.body.length > 200
                  ? `${article.body.slice(0, 200)}...`
                  : article.body}
              </p>
            </div>
            <div class="flex items-center">
              <a
                class="btn btn-primary btn-sm"
                href={`/news/${article.slug}/edit`}>{m.news_edit()}</a
              >
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <section class="grid grid-cols-1 gap-8 md:grid-cols-2">
    {#each data.articles as article (article.id)}
      <SmallArticleCard {article} />
    {/each}
  </section>

  <Pagination count={data.pageCount} />
</div>
