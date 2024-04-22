<script lang="ts">
  import Articles from "./Articles.svelte";
  import Events from "./Events.svelte";
  import Meetings from "./Meetings.svelte";
  import WellbeingCTA from "./WellbeingCTA.svelte";
  import CafeOpenTimes from "./CafeOpenTimes.svelte";

  import type { PageData } from "./$types";
  import Documents from "./Documents.svelte";
  export let data: PageData;
</script>

<svelte:head>
  <title>Homepage</title>
</svelte:head>

<div class="container mx-auto grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
  <Events events={data.events} />
  <Articles news={data.news} />
  <div class="flex flex-col gap-4">
    <WellbeingCTA />
    <CafeOpenTimes cafeOpen={data.cafeOpen} />
    <Meetings
      upcoming={data.meetings.upcoming}
      previous={data.meetings.previous}
    />
    <Documents files={data.files} />
  </div>
</div>
