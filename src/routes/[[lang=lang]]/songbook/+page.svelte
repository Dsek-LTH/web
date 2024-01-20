<script lang="ts">
  import { enhance } from "$app/forms";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import apiNames from "$lib/utils/apiNames";
  import Disclaimer from "./Disclaimer.svelte";
  import SongElement from "./SongElement.svelte";

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

{#if data.accessPolicies.includes(apiNames.SONG.DELETE)}
  <form
    method="get"
    class="my-4 flex items-center justify-end gap-2"
    use:enhance
    bind:this={form}
  >
    <input
      class="checkbox"
      type="checkbox"
      name="show-deleted"
      value="true"
      checked={data.params.includes("show-deleted")}
      on:change={() => form.requestSubmit()}
    />
    <label class="label" for="show-deleted">Visa borttagna sånger</label>
  </form>
{/if}

<div class="my-4 flex flex-wrap justify-between">
  {#each Object.keys(data.categories) as catId}
    <a
      class="flex-grow"
      href={hrefWithParam("category", isCatSelected(catId) ? "" : catId)}
    >
      <div
        class={(isCatSelected(catId)
          ? "bg-neutral-600"
          : "hover:bg-neutral-700") +
          " m-1 rounded-lg px-2 py-1 text-center ring-neutral-700 transition hover:scale-105 md:ring-1"}
      >
        {data.categories[catId]}
      </div>
    </a>
  {/each}
</div>

<section>
  <form method="get" id="filter-form" use:enhance>
    <SearchBar />
  </form>
</section>

{#each data.songs as song}
  <div class="rounded-lg hover:ring-2 hover:ring-primary">
    <a href={`/songbook/${song.slug}`}>
      <SongElement {song} accessPolicies={data.accessPolicies} />
    </a>
  </div>
{/each}

<Pagination count={data.pageCount} />
