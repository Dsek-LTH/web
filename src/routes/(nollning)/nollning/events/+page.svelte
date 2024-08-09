<script lang="ts">
  import Event from "./Event.svelte";
  import PostRevealSlot from "./PostRevealSlot.svelte";

  export let data;
  $: events = data.events;
  let weekCollapseOpen = false;
  $: weeks = Array(data.weeks)
    .fill(0)
    .map((_, i) => i);
</script>

<div class="mb-4 flex items-start justify-between">
  <a href="events/subscribe" class="btn btn-ghost -mx-4"
    >Hämta kalender <span class="i-mdi-arrow-down" /></a
  >
  <PostRevealSlot title="vecka {data.week}" bind:checked={weekCollapseOpen}>
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
  </PostRevealSlot>
</div>
<div class="flex flex-col gap-4">
  {#each events as event (event.id)}
    <Event {event} />
  {/each}
</div>
