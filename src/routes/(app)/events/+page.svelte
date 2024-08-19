<script lang="ts">
  import { page } from "$app/stores";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import SmallEventCard from "./SmallEventCard.svelte";
  import type { Tag } from "@prisma/client";
  import * as m from "$paraglide/messages";

  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import { toast } from "$lib/stores/toast";
  export let data: PageData;
  let filteredTags: Tag[] = data.allTags.filter((tag) =>
    $page.url.searchParams.getAll("tags").includes(tag.name),
  );
  let filterButton: HTMLButtonElement;
  $: isPast = $page.url.searchParams.get("past") == "on";
  $: eventsSubscribeUrl = `${$page.url.origin}${$page.url.pathname}/subscribe`;
</script>

<SetPageTitle title={m.events()} />

<section class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    {#if isAuthorized(apiNames.EVENT.CREATE, data.user)}
      <a class="btn" href="/events/create">
        <span class="i-mdi-create" />{m.events_create()}
      </a>
    {/if}
    <a class="btn" href="/events/calendar">
      <span class="i-mdi-calendar" />{m.events_calendar()}
    </a>

    <details
      class="dropdown"
      on:toggle={(event) => {
        if (event.target instanceof HTMLDetailsElement && event.target.open) {
          navigator.clipboard.writeText(eventsSubscribeUrl);
          toast(m.events_calendar_subscribe_copyToClipboard(), "success");
        }
      }}
    >
      <summary class="btn">
        <span class="i-mdi-calendar-sync" />{m.events_calendar_subscribe()}
      </summary>
      <div class="dropdown-content z-[1] rounded-box bg-base-300 p-4 shadow">
        <p>
          {m.events_calendar_subscribe_details()}
        </p>
        <p class="my-2 rounded border p-2 font-mono text-sm">
          {eventsSubscribeUrl}
        </p>
      </div>
    </details>
    {#if isAuthorized(apiNames.TAGS.CREATE, data.user) || isAuthorized(apiNames.TAGS.UPDATE, data.user)}
      <a class="btn" href="/news/tags">
        <span class="i-mdi-tag" />{m.events_tags()}
      </a>
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
