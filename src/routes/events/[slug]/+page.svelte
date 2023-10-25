<script lang="ts">
  import TagChip from "$lib/components/TagChip.svelte";
  import Event from "../Event.svelte";

  export let data;
  $: event = data.event;
</script>

<Event {event}>
  <div slot="actions">
    {#if data.canEdit}
      <a class="text-primary hover:underline" href={`/events/${event.slug}/edit`}> Redigera </a>
    {/if}
  </div>

  <div slot="tags" class="flex flex-row flex-wrap gap-2">
    {#each event.tags as tag}
      <TagChip {tag} />
    {/each}
  </div>
</Event>
