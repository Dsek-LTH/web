<script lang="ts">
  import { page } from "$app/state";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import * as m from "$paraglide/messages";
  import type { Tag } from "@prisma/client";
  import SmallEventCard from "./SmallEventCard.svelte";

  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { EventPageLoadData } from "./EventPageLoad";

  interface Props {
    data: EventPageLoadData & typeof page.data;
    children?: import("svelte").Snippet;
  }

  let { data, children }: Props = $props();
  let filteredTags: Tag[] = $state(
    data.allTags.filter((tag) =>
      page.url.searchParams.getAll("tags").includes(tag.name),
    ),
  );
  let filterButton: HTMLButtonElement = $state();
  let isPast = $derived(page.url.searchParams.get("past") == "on");
</script>

<SetPageTitle title={m.events()} />

<section class="flex flex-col gap-2">
  {@render children?.()}
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
          onchange={() => filterButton.click()}
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
          onchange={() => filterButton.click()}
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
        onchange={() => filterButton.click()}
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
