<script lang="ts">
  import { page } from "$app/stores";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import apiNames from "$lib/utils/apiNames";
  import type { Tag } from "@prisma/client";
  import SmallArticleCard from "./SmallArticleCard.svelte";

  export let data;
  let filteredTags: Tag[] = data.allTags.filter((tag) =>
    $page.url.searchParams.getAll("tags").includes(tag.name)
  );
</script>

<svelte:head>
  <title>Nyheter | D-sektionen</title>
</svelte:head>

<section class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    {#if data.accessPolicies.includes(apiNames.NEWS.CREATE)}
      <a class="btn" href="/news/create">+ Create</a>
    {/if}
    {#if data.accessPolicies.includes(apiNames.TAGS.CREATE) || data.accessPolicies.includes(apiNames.TAGS.UPDATE)}
      <a class="btn" href="/news/tags">Tags</a>
    {/if}
  </div>
  <form method="get" class="form-control flex-1 flex-row items-end gap-2" id="filter-form">
    <SearchBar />
    <TagSelector allTags={data.allTags} bind:selectedTags={filteredTags} />
    {#each filteredTags as tag (tag.id)}
      <input type="hidden" name="tags" value={tag.name} />
    {/each}
    <button type="submit" class="btn btn-primary">Filter</button>
  </form>
</section>

{#each data.articles as article (article.id)}
  <SmallArticleCard
    {article}
    author={article.author}
    tags={article.tags}
    likers={article.likers}
    commentCount={article.comments.length}
    onTagClick={(tag) => {
      const referencedTag = data.allTags.find((t) => t.name === tag.name);
      if (!referencedTag) return console.error("Tag not found");
      filteredTags = [referencedTag]; // we need correct reference for selector
    }}
  />
{/each}

<Pagination pages={data.pageCount} />
