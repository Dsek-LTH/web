<script lang="ts">
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import { sanitize } from "isomorphic-dompurify";

  export let data;
</script>

{#each data.categories as cat}
  <div>{cat.category}</div>
{/each}

<section>
  <form method="get" id="filter-form">
    <SearchBar />
  </form>
</section>

{#each data.songs as song}
  <article class="my-4 rounded-lg p-6 shadow-2xl ring-neutral-700 md:ring-1">
    <div class="flex justify-between">
      <h2 class="my-3 text-2xl font-bold">
        {@html sanitize(song.title)}
      </h2>

      <p class="text-right text-xs text-gray-500">
        {song.createdAt?.toLocaleDateString(["sv"])} <br />
        {song.createdAt?.toLocaleTimeString(["sv"], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>

    <h3 class="mb-4 text-lg italic text-gray-500">
      {song.category}
    </h3>

    <p class="mb-4">Melodi: {song.melody}</p>
    <p class="whitespace-pre-line">{@html sanitize(song.lyrics)}</p>
  </article>
{/each}

<Pagination pages={data.pageCount} />
