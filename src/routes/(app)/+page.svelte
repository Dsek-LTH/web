<script lang="ts">
  import Header from "./Header.svelte";
  import Articles from "./Articles.svelte";
  import Events from "./Events.svelte";
  import CaféOpenTimes from "./CaféOpenTimes.svelte";
  import Meetings from "./Meetings.svelte";
  import WellbeingCTA from "./WellbeingCTA.svelte";

  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>D-sektionen</title>
</svelte:head>

<div
  class="container mx-auto grid grid-cols-1 gap-8 p-4 md:grid-cols-2 lg:grid-cols-3"
>
  <Header />

  <article
    class="row-span-6 bg-primary px-6 py-3 lg:col-start-3 lg:row-span-2 lg:row-start-1"
  >
    <Articles news={data.news} />
  </article>

  <Events events={data.events} />

  <CaféOpenTimes cafeOpen={data.cafeOpen} />
  <Meetings
    upcoming={data.meetings.upcoming}
    previous={data.meetings.previous}
  />
  <WellbeingCTA />
</div>
