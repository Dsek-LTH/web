<script lang="ts">
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { PageData } from "./$types";
  import TvEventCard from "./TVEventCard.svelte";
  import * as m from "$paraglide/messages";

  export let data: PageData;
</script>

<SetPageTitle title={m.events()} />

<section class="flex flex-col gap-8 space-y-4 px-14">
  {#each data.events as event (event.id)}
    <TvEventCard {event} />
  {/each}
</section>
