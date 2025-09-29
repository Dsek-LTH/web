<script lang="ts">
  import { page } from "$app/stores";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import * as m from "$paraglide/messages";
  import SmallEventCard from "./SmallEventCard.svelte";

  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { EventPageLoadData } from "./EventPageLoad";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  export let data: EventPageLoadData & typeof $page.data;
  let filteredTags: Array<ExtendedPrismaModel<"Tag">> = data.allTags.filter(
    (tag) => $page.url.searchParams.getAll("tags").includes(tag.name),
  );
  let filterButton: HTMLButtonElement;
  $: isPast = $page.url.searchParams.get("past") == "on";
</script>

<SetPageTitle title={m.events()} />

<section class="flex flex-col gap-2">
  <slot />
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
        {m.events_coming()}
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
        {m.events_past()}
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
    <button type="submit" class="btn btn-primary" bind:this={filterButton}>
      {m.events_filter()}
    </button>
  </form>
  {#each data.events as event (event.id)}
    <SmallEventCard {event} interestedGoingForm={data.interestedGoingForm} />
  {/each}
  <Pagination count={data.pageCount} />
</section>
