<script lang="ts">
  import ActivityButton from "./ActivityButton.svelte";

  import type { Event } from "@prisma/client";
  export let events: Event[];
</script>

<h2 class="mb-2 text-lg">Publicerade evenemang</h2>
<div class="flex flex-col gap-2">
  {#each events as event (event.id)}
    <ActivityButton
      link="/events/{event.slug}"
      title={event.title}
      rightAdornment={event.startDatetime?.toLocaleDateString("sv")}
    />
  {/each}
</div>
