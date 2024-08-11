<script lang="ts">
  import { page } from "$app/stores";
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import { toast } from "$lib/stores/toast";
  import * as m from "$paraglide/messages";
  import Event from "./Event.svelte";
  import PostRevealSelect from "./PostRevealSelect.svelte";

  export let data;
  $: events = data.events;
  let weekCollapseOpen = false;
  $: weeks = Array(data.weeks)
    .fill(0)
    .map((_, i) => i);
  $: eventsSubscribeUrl = `${$page.url.origin}${$page.url.pathname}/subscribe`;
</script>

<PageHeader title="Event" />

<div class="mb-4 flex items-start justify-between">
  <details
    class="dropdown"
    on:toggle={(event) => {
      if (event.target instanceof HTMLDetailsElement && event.target.open) {
        navigator.clipboard.writeText(eventsSubscribeUrl);
        toast(m.events_calendar_subscribe_copyToClipboard(), "success");
      }
    }}
  >
    <summary class="btn btn-ghost -mx-4"
      >Prenumerera
      <span class="i-mdi-calendar-sync" />
    </summary>
    <div
      class="dropdown-content z-20 -ml-8 w-[calc(100dvw-1rem)] rounded-box bg-base-300 p-4 shadow"
    >
      <p>
        {m.events_calendar_subscribe_details()}
      </p>
      <p
        class="my-2 w-full select-all overflow-x-auto rounded border p-2 font-mono text-sm"
      >
        {eventsSubscribeUrl}
      </p>
    </div>
  </details>
  <PostRevealSelect title="vecka {data.week}" bind:checked={weekCollapseOpen}>
    <ul class="flex flex-col">
      {#each weeks as i}
        {@const isCurrent = i === data.week}
        <li class:bg-primary={isCurrent} class="px-2 py-1 last:pb-2">
          <a
            class="font-medium"
            href="?week={i}"
            on:click={() => (weekCollapseOpen = false)}>vecka {i}</a
          >
        </li>
      {/each}
    </ul>
  </PostRevealSelect>
</div>
<div class="flex flex-col gap-4">
  {#each events as event (event.id)}
    <Event {event} />
  {/each}
</div>
