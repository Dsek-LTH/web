<script lang="ts">
  import { page } from "$app/stores";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import SmallEventCard from "./SmallEventCard.svelte";
  import type { Tag } from "@prisma/client";

  import type { PageData } from "./$types";
  export let data: PageData;
  let filteredTags: Tag[] = data.allTags.filter((tag) =>
    $page.url.searchParams.getAll("tags").includes(tag.name),
  );
  let filterButton: HTMLButtonElement;
  $: isPast = $page.url.searchParams.get("past") == "on";
</script>

<svelte:head>
  <title>Evenemang | D-sektionen</title>
</svelte:head>

<section class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    <a class="btn" href="/events/calendar"
      ><span class="i-mdi-calendar"></span>
      Kalender</a
    >
    {#if isAuthorized(apiNames.EVENT.CREATE, data.user)}
      <a class="btn" href="/events/create"
        ><span class="i-mdi-create"></span>Create</a
      >
    {/if}
    {#if isAuthorized(apiNames.TAGS.CREATE, data.user) || isAuthorized(apiNames.TAGS.UPDATE, data.user)}
      <a class="btn" href="/news/tags"><span class="i-mdi-tag"></span>Tags</a>
    {/if}
  </div>
  <form
    method="get"
    class="form-control flex-1 gap-2 md:flex-row md:items-center"
    id="filter-form"
  >
    <div class="join">
      <label
        class="btn btn-primary join-item {!isPast
          ? 'pointer-events-none'
          : 'btn-outline'}"
      >
        Kommande
        <input
          type="radio"
          name="past"
          value="off"
          checked={!isPast}
          class="hidden"
          on:change={() => filterButton.click()}
        />
      </label>
      <label
        class="btn btn-primary join-item {isPast
          ? 'pointer-events-none'
          : 'btn-outline'}"
      >
        Tidigare
        <input
          type="radio"
          name="past"
          value="on"
          checked={isPast}
          class="hidden"
          on:change={() => filterButton.click()}
        />
      </label>
    </div>
    <TagSelector allTags={data.allTags} bind:selectedTags={filteredTags} />
    <SearchBar />
    {#each filteredTags as tag (tag.id)}
      <input
        type="hidden"
        name="tags"
        value={tag.name}
        on:change={() => filterButton.click()}
      />
    {/each}
    <button type="submit" class="btn btn-primary" bind:this={filterButton}
      >Filter</button
    >
  </form>
</section>
{#each data.events as event (event.id)}
  <SmallEventCard {event} interestedGoingForm={data.interestedGoingForm}/>
{/each}

<Pagination count={data.pageCount} />
