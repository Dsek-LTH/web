<script lang="ts">
  import Articles from "./Articles.svelte";
  import Events from "./Events.svelte";
  import WellbeingCTA from "./WellbeingCTA.svelte";
  import CafeOpenTimes from "./CafeOpenTimes.svelte";
  import KodaMedDWWW from "./KodaMedDWWW.svelte";

  import type { PageData } from "./$types";
  import Documents from "./Documents.svelte";
  import DsekLogo from "../../DsekLogo.svelte";
  import { page } from "$app/stores";
  import { getFullName } from "$lib/utils/client/member";
  export let data: PageData;
</script>

<svelte:head>
  <title>Homepage</title>
</svelte:head>

<div class="grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-5">
  <div class="col-span-1 hidden flex-col place-items-center xl:flex">
    <DsekLogo className="size-48 text-primary pl-4" />
    {#if $page.data.member}
      <div class="pt-2 text-2xl font-bold">
        {getFullName($page.data.member)}
      </div>
    {/if}
  </div>
  <div
    class="flex flex-col md:-order-2 md:col-span-2 lg:order-none lg:col-span-3 xl:col-span-4"
  >
    <Articles news={data.news} />
  </div>

  <div class="md:col-span-3 lg:col-span-2 xl:col-span-3">
    <Events events={data.events} />
  </div>

  <div
    class="flex flex-col justify-evenly gap-4 py-4 sm:flex-row md:-order-1 md:flex-col lg:order-none lg:col-span-1 xl:col-span-2"
  >
    <WellbeingCTA />
    <CafeOpenTimes cafeOpen={data.cafeOpen} />
  </div>

  <div
    class="order-last md:col-span-3 lg:col-span-3 xl:order-none xl:col-span-2"
  >
    <KodaMedDWWW
      commitCount={data.commitCount}
      commitData={data.latestCommit}
    />
  </div>

  <div class="md:col-span-3 xl:col-span-3">
    <Documents files={data.files} />
  </div>
</div>
<!--
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
</div>-->
