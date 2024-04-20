<script lang="ts">
  import { page } from "$app/stores";
  import Header from "./Header.svelte";
  import Articles from "./Articles.svelte";
  import Events from "./Events.svelte";
  import CaféOpenTimes from "./CaféOpenTimes.svelte";
  import Meetings from "./Meetings.svelte";
  import WellbeingCTA from "./WellbeingCTA.svelte";

  import type { PageData } from "./$types";
  import Links from "./Links.svelte";
  import Carousel from "./Carousel.svelte";
  export let data: PageData;
</script>

<svelte:head>
  <title>D-sektionen</title>
</svelte:head>

{#if $page.data.user && $page.data.member}
  <div class="container mx-auto grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
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
{:else}
  <Header />
  <Links />
  <Carousel />
  <div
    class="min-h-screen opacity-20 grayscale"
    style="background-image: url(./pattern.png);"
  >
    a
  </div>
{/if}
