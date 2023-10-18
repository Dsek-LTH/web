<script lang="ts">
  import { page } from "$app/stores";
  import apiNames from "$lib/apiNames.js";
  import TagChip from "$lib/components/TagChip.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import type { Tag } from "@prisma/client";
  import { marked } from "marked";
  import SearchBar from "../../lib/components/SearchBar.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import AuthorSignature from "$lib/components/AuthorSignature.svelte";

  export let data;
  let filteredTags: Tag[] = data.allTags.filter((tag) =>
    $page.url.searchParams.getAll("tags").includes(tag.name)
  );
</script>

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
  <article
    class="ease my-4 rounded-lg p-6 shadow-2xl ring-neutral-700 transition md:ring-1 md:hover:scale-[1.01]"
  >
    <div class="flex flex-row justify-between">
      <AuthorSignature author={article.author} />

      <p class="text-right text-xs text-gray-500">
        {article.publishedAt?.toLocaleDateString(["sv"])} <br />
        {article.publishedAt?.toLocaleTimeString(["sv"], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>

    <a href="/news/{article.slug}">
      <h2 class="my-3 text-2xl font-bold">{article.header}</h2>
    </a>

    <div class="my-3 flex flex-row items-start gap-2">
      <div
        class="prose-a prose line-clamp-4 text-ellipsis lg:prose-xl prose-a:text-primary prose-a:no-underline"
      >
        <!-- The article body is sanitized server-side. -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html marked(article.body.slice(0, 400))}
      </div>
      {#if article.imageUrl}
        <figure class="flex-1">
          <img class="rounded-2xl" src={article.imageUrl} alt={article.header} />
        </figure>
      {/if}
    </div>

    <div class="flex flex-row flex-wrap gap-2">
      {#each article.tags as tag}
        <a
          href="?tags={encodeURIComponent(tag.name)}"
          class="opacity-80 transition-opacity hover:opacity-100"
          on:click={() => {
            const referencedTag = data.allTags.find((t) => t.name === tag.name);
            if (!referencedTag) return console.error("Tag not found");
            filteredTags = [referencedTag]; // we need correct reference for selector
          }}
        >
          <TagChip {tag} />
        </a>
      {/each}
    </div>
  </article>
{/each}

<Pagination pages={data.pageCount} />
