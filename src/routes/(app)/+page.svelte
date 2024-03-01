<script lang="ts">
  import LandingPageHeader from "./(LandingPage)/LandingPageHeader.svelte";
  import LandingPageArticles from "./(LandingPage)/LandingPageArticles.svelte";
  import LandingPageEvents from "./(LandingPage)/LandingPageEvents.svelte";
  import LandingPageCaféOpenTimes from "./(LandingPage)/LandingPageCaféOpenTimes.svelte";
  import LandingPageMeetings from "./(LandingPage)/LandingPageMeetings.svelte";
  import LandingPageWellbeingCTA from "./(LandingPage)/LandingPageWellbeingCTA.svelte";

  import GlobalAlert from "$lib/components/GlobalAlert.svelte";
  import { languageTag } from "$paraglide/runtime";
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<svelte:head>
  <title>D-sektionen</title>
</svelte:head>

{#each data.alert as alert}
  <GlobalAlert
    message={languageTag() === "sv" ? alert.message : alert.messageEn}
    severity={alert.severity}
  />
{/each}
<div
  class="container mx-auto grid grid-cols-1 gap-8 p-4 md:grid-cols-2 lg:grid-cols-3"
>
  <LandingPageHeader />
  <article
    class="row-span-6 bg-primary px-6 py-3 lg:col-start-3 lg:row-span-2 lg:row-start-1"
  >
    <LandingPageArticles news={data.news} />
  </article>
  <LandingPageEvents events={data.events} />
  <LandingPageCaféOpenTimes cafeOpen={data.cafeOpen} />

  <LandingPageMeetings
    upcoming={data.meetings.upcoming}
    previous={data.meetings.previous}
  />

  <LandingPageWellbeingCTA />
</div>
