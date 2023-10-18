<script lang="ts">
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
</Event>
