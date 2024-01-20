<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import Disclaimer from "./Disclaimer.svelte";
  import SongElement from "./SongElement.svelte";

  function isCatSelected(catId: string): boolean {
    return (data.category ?? "").startsWith(catId);
  }

  export let data;
  let form: HTMLFormElement;
</script>

<div class="flex flex-row">
  <PageHeader title="Sjungbok" />
  {#if data.accessPolicies.includes(apiNames.SONG.CREATE)}
    <div class="ml-auto">
      <a href="/songbook/create">
        <button class="btn">Skapa ny sång</button>
      </a>
    </div>
  {/if}
</div>

<p class="text-xl font-bold">
  Här hittar du alla sånger som finns i D-sektionens digitala sångarkiv!
</p>
<Disclaimer />

<form method="GET" bind:this={form} data-sveltekit-keepfocus>
  {#if data.accessPolicies.includes(apiNames.SONG.DELETE)}
    <div class="my-4 flex items-center justify-end gap-2">
      <input
        class="checkbox"
        type="checkbox"
        name="show-deleted"
        value="true"
        checked={data.params.includes("show-deleted")}
        on:change={() => form.requestSubmit()}
      />
      <label class="label" for="show-deleted">
        Visa endast borttagna sånger
      </label>
    </div>
  {/if}

  <div class="my-4 flex flex-wrap justify-between">
    {#each Object.keys(data.categories) as catId}
      <label
        class="m-1 flex-grow cursor-pointer rounded-lg px-2 py-1 text-center ring-neutral-700 transition hover:scale-105 hover:bg-neutral-700 md:ring-1"
        class:bg-neutral-600={isCatSelected(catId)}
      >
        {data.categories[catId]}
        <input
          hidden
          type="radio"
          name="category"
          value={catId}
          checked={isCatSelected(catId)}
          on:change={() => form.requestSubmit()}
        />
      </label>
    {/each}
  </div>

  <SearchBar />
</form>

{#each data.songs as song}
  <div class="rounded-lg hover:ring-2 hover:ring-primary">
    <a href={`/songbook/${song.slug}`}>
      <SongElement {song} accessPolicies={data.accessPolicies} />
    </a>
  </div>
{/each}

<Pagination count={data.pageCount} />
