<script lang="ts">
  import { page } from "$app/stores";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import apiNames from "$lib/utils/apiNames";
  import type { Tag } from "@prisma/client";
  import { isAuthorized } from "$lib/utils/authorization";

  import type { PageData } from "./$types";
  import { getFullName } from "$lib/utils/client/member";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
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
    <div class="flex items-center gap-2">
      {#if isAuthorized(apiNames.NEWS.CREATE, data.user)}
        <a class="btn" href="/news/create">+ Create</a>
      {/if}
      {#if isAuthorized(apiNames.TAGS.CREATE, data.user) || isAuthorized(apiNames.TAGS.UPDATE, data.user)}
        <a class="btn" href="/news/tags">Tags</a>
      {/if}
    </div>

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
      <button type="submit" class="btn btn-primary">Filter</button>
    </form>
  </section>

  <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
    {#each data.articles as article (article.id)}
      <div class="flex flex-col rounded-xl bg-base-200 p-8">
        <div
          class="-m-8 mb-8 flex justify-between gap-4 rounded-t-xl bg-base-300 p-4"
        >
          <div class="flex flex-wrap gap-2">
            {#each article.tags as tag}
              <span class="badge text-xs text-neutral-400">{tag.name}</span>
            {/each}
          </div>
        </div>

        <div class="flex-1">
          <a href={"news/" + article.slug} class="group">
            <h1 class="text-2xl font-bold group-hover:underline">
              {article.header}
            </h1>
            <MarkdownBody
              class="mb-8 mt-2 line-clamp-3 !text-base"
              body={article.body}
            />
          </a>
        </div>

        <div class="flex gap-4">
          <a href={"members/" + article.author.member.studentId}>
            <img
              class="size-10 rounded-full object-cover"
              src={article.author.member.picturePath}
              alt={article.author.member.firstName}
            />
          </a>
          <div class="flex w-full items-center justify-between gap-4">
            <div>
              <a href={"members/" + article.author.member.studentId}>
                <h2 class="text-sm font-semibold text-primary hover:underline">
                  {getFullName(article.author.member)}
                </h2>
              </a>
              {#if article.author.mandate}
                <a href={"positions/" + article.author.mandate.position.id}>
                  <p class="my-1 text-xs font-light hover:underline">
                    {article.author.mandate.position.name}
                  </p>
                </a>
              {/if}
            </div>
            <p class="my-1 self-end text-xs font-light text-neutral-600">
              {article.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <Pagination count={data.pageCount} />
</div>
