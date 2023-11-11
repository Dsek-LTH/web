<script lang="ts">
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import he from "he";

  function fixText(s: string): string {
    return he
      .decode(s)
      .replaceAll("---", "—")
      .replaceAll("--", "–")
      .replaceAll("||:", "𝄆")
      .replaceAll(":||", "𝄇")
      .replaceAll("|:", "𝄆")
      .replaceAll(":|", "𝄇");
  }

  function isCatSelected(catId: string): boolean {
    return (data.category ?? "").startsWith(catId);
  }

  function hrefWithParam(param: string, value: string | undefined): string {
    const urlParams = new URLSearchParams(data.params);
    if (value) {
      urlParams.set(param, value);
    } else {
      urlParams.delete(param);
    }
    urlParams.delete("page");

    return "?" + urlParams.toString();
  }

  export let data;
</script>

<div class="my-4 flex flex-wrap justify-between">
  {#each Object.keys(data.categories) as catId}
    <a class="flex-grow" href={hrefWithParam("category", isCatSelected(catId) ? "" : catId)}>
      <div
        class={(isCatSelected(catId) ? "bg-neutral-600" : "hover:bg-neutral-700") +
          " m-1 rounded-lg px-2 py-1 text-center ring-neutral-700 transition hover:scale-105 md:ring-1"}
      >
        {data.categories[catId]}
      </div>
    </a>
  {/each}
</div>

<section>
  <form method="get" id="filter-form">
    <SearchBar />
  </form>
</section>

{#each data.songs as song}
  <article class="my-4 rounded-lg p-6 shadow-2xl ring-neutral-700 md:ring-1">
    <div class="flex justify-between">
      <h2 class="my-3 text-2xl font-bold">
        {fixText(song.title)}
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

    <p class="mb-4 italic">Mel: {song.melody}</p>
    <p class="whitespace-pre-line">
      {fixText(song.lyrics)}
    </p>
  </article>
{/each}

<Pagination pages={data.pageCount} />
