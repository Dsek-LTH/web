<script lang="ts">
  import { page } from "$app/stores";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import apiNames from "$lib/utils/apiNames";
  import type { Tag } from "@prisma/client";
  import { isAuthorized } from "$lib/utils/authorization";
  import SmallArticleCard from "./SmallArticleCard.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
  let filteredTags: Tag[] = data.allTags.filter((tag) =>
    $page.url.searchParams.getAll("tags").includes(tag.name),
  );
</script>

<svelte:head>
  <title>Nyheter | D-sektionen</title>
</svelte:head>

<div class="space-y-4">
  <section class="flex flex-col gap-2">
    <form
      method="get"
      class="form-control flex-1 gap-2 md:flex-row md:items-end"
      id="filter-form"
    >
      <TagSelector allTags={data.allTags} bind:selectedTags={filteredTags} />
      <SearchBar />
      {#each filteredTags as tag (tag.id)}
        <input type="hidden" name="tags" value={tag.name} />
      {/each}
      {#if isAuthorized(apiNames.TAGS.CREATE, data.user) || isAuthorized(apiNames.TAGS.UPDATE, data.user)}
        <a class="btn" href="/news/tags">Tags</a>
      {/if}
      {#if isAuthorized(apiNames.NEWS.CREATE, data.user)}
        <a class="btn btn-primary" href="/news/create">+ Create</a>
      {/if}
    </form>
  </section>

  <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
    {#each data.articles as article (article.id)}
      <SmallArticleCard {article} />
    {/each}
  </div>

  <Pagination count={data.pageCount} />
</div>
