<script lang="ts">
  import { page } from "$app/stores";
  import Header from "./Header.svelte";
  import Articles from "./Articles.svelte";
  import Events from "./Events.svelte";
  import Meetings from "./Meetings.svelte";
  import WellbeingCTA from "./WellbeingCTA.svelte";

  import type { PageData } from "./$types";
  import Links from "./Links.svelte";
  import Carousel from "./Carousel.svelte";
  import Documents from "./Documents.svelte";
  export let data: PageData;
</script>

<svelte:head>
  <title>D-sektionen</title>
</svelte:head>

{#if $page.data.user && $page.data.member}
  <div class="container mx-auto grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
    <Events events={data.events} />
    <Articles news={data.news} />
    <Documents files={data.files} />

    <!-- <CaféOpenTimes cafeOpen={data.cafeOpen} /> -->
    <Meetings
      upcoming={data.meetings.upcoming}
      previous={data.meetings.previous}
    />
    <WellbeingCTA />
  </div>
{:else}
  <Header />
  <Links />
  <Carousel />
  <div class="min-h-screen bg-[url('/pattern.png')]" />
{/if}
