<script lang="ts">
  import Articles from "$lib/components/home/Articles.svelte";
  import Events from "$lib/components/home/Events.svelte";
  import WellbeingCTA from "$lib/components/home/WellbeingCTA.svelte";
  import CafeOpenTimes from "$lib/components/home/CafeOpenTimes.svelte";
  import CodeWithDWWW from "$lib/components/home/CodeWithDWWW.svelte";
  import Documents from "$lib/components/home/Documents.svelte";

  import type { PageData } from "./$types";
  import DsekLogo from "$lib/components/DsekLogo.svelte";
  import { page } from "$app/stores";
  import { getFullName } from "$lib/utils/client/member";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import * as m from "$paraglide/messages";
  export let data: PageData;
</script>

<SetPageTitle />

<div class="grid grid-cols-1 gap-x-5 gap-y-10 md:grid-cols-3 xl:grid-cols-5">
  <section class="col-span-1 hidden flex-col place-items-center xl:flex">
    <DsekLogo class="size-48 pl-4 text-primary" />
    {#if $page.data.member}
      <div class="pt-2 text-center text-2xl font-bold">
        {getFullName($page.data.member)}
      </div>

      {#if data.hasActiveMandate}
        <a href="/info/benefits"
          ><span class="badge badge-primary mt-2 hover:underline">
            <span class="i-mdi-coffee m-1"></span>{m.home_volunteer()}
          </span>
        </a>
      {/if}
    {/if}
  </section>
  <section
    class="flex flex-col md:-order-2 md:col-span-3 lg:order-none lg:col-span-3 xl:col-span-4"
  >
    <Articles news={data.news} />
  </section>

  <section class="md:col-span-3 lg:col-span-2 xl:col-span-3">
    <Events events={data.events} />
  </section>

  <section
    class="flex flex-col justify-evenly gap-4 sm:flex-row md:col-span-3 lg:col-span-1 lg:flex-col xl:col-span-2"
  >
    <WellbeingCTA />
    <CafeOpenTimes cafeOpen={data.cafeOpen} />
  </section>

  <section
    class="order-last md:col-span-3 lg:col-span-3 xl:order-none xl:col-span-2"
  >
    <CodeWithDWWW
      commitCount={data.commitCount}
      commitData={data.latestCommit}
    />
  </section>

  <section class="md:col-span-3 xl:col-span-3">
    <Documents files={data.files} />
  </section>
</div>
