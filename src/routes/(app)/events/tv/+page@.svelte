<script lang="ts">
  import type { PageData } from "./$types";
  import TvEventCard from "./TVEventCard.svelte";
  export let data: PageData;
</script>

<section class="flex flex-col gap-2 px-14">
  {#each data.events as event (event.id)}
    <TvEventCard {event} />
  {/each}
</section>
