<script lang="ts">
  import { page } from "$app/stores";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import Pagination from "$lib/components/Pagination.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import TagSelector from "$lib/components/TagSelector.svelte";
  import apiNames from "$lib/utils/apiNames";
  import { relativeDate } from "$lib/utils/datetime.js";
  import type { Tag } from "@prisma/client";

  export let data;
  let filteredTags: Tag[] = data.allTags.filter((tag) =>
    $page.url.searchParams.getAll("tags").includes(tag.name)
  );
  let filterButton: HTMLButtonElement;
  $: isPast = $page.url.searchParams.get("past") == "on";
</script>

<section class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    {#if data.accessPolicies.includes(apiNames.EVENT.CREATE)}
      <a class="btn" href="/events/create">+ Create</a>
    {/if}
    {#if data.accessPolicies.includes(apiNames.TAGS.CREATE) || data.accessPolicies.includes(apiNames.TAGS.UPDATE)}
      <a class="btn" href="/news/tags">Tags</a>
    {/if}
  </div>
  <form method="get" class="form-control flex-1 flex-row items-center gap-2" id="filter-form">
    <div class="join">
      <label class="btn btn-primary join-item {!isPast ? 'pointer-events-none' : 'btn-outline'}">
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
      <label class="btn btn-primary join-item {isPast ? 'pointer-events-none' : 'btn-outline'}">
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
    <SearchBar />
    <TagSelector allTags={data.allTags} bind:selectedTags={filteredTags} />
    {#each filteredTags as tag (tag.id)}
      <input type="hidden" name="tags" value={tag.name} on:change={() => filterButton.click()} />
    {/each}
    <button type="submit" class="btn btn-primary" bind:this={filterButton}>Filter</button>
  </form>
</section>
{#each data.events as event (event.id)}
  <article
    class="ease my-4 rounded-lg p-6 shadow-2xl ring-neutral-700 transition md:ring-1 md:hover:scale-[1.01]"
  >
    <a href="/events/{event.slug}">
      <h2 class="text-2xl font-bold">{event.title}</h2>
    </a>

    <section class="text-primary">
      {#if Math.abs(event.startDatetime.valueOf() - event.endDatetime.valueOf()) < 24 * 60 * 60 * 1000}
        <span class="font-semibold">{relativeDate(event.startDatetime)}</span> <br />
        {event.startDatetime?.toLocaleTimeString(["sv"], {
          hour: "2-digit",
          minute: "2-digit",
        })} →
        {event.endDatetime?.toLocaleTimeString(["sv"], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      {:else}
        <div class="flex flex-row items-center gap-4">
          <div>
            <span class="font-semibold">{relativeDate(event.startDatetime)}</span> <br />
            {event.startDatetime?.toLocaleTimeString(["sv"], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          →
          <div>
            <span class="font-semibold">{relativeDate(event.endDatetime)}</span> <br />
            {event.endDatetime?.toLocaleTimeString(["sv"], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      {/if}
    </section>

    <div class="my-3 flex flex-col items-start gap-2">
      <MarkdownBody
        body={event.shortDescription}
        class="mb-2 text-xl font-semibold !leading-snug"
      />
      <MarkdownBody body={event.description} class="line-clamp-4 text-ellipsis" />
    </div>

    <div class="flex flex-row flex-wrap gap-2">
      {#each event.tags as tag}
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
