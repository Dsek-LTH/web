<script lang="ts">
  import Articles from "$lib/components/home/Articles.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import Events from "$lib/components/home/Events.svelte";
  import WellbeingCta from "$lib/components/home/WellbeingCTA.svelte";
  import SRDCta from "$lib/components/home/SRDCTA.svelte";
  import CafeOpenTimes from "$lib/components/home/CafeOpenTimes.svelte";
  import Documents from "$lib/components/home/Documents.svelte";
  import CodeWithDwww from "$lib/components/home/CodeWithDWWW.svelte";
  import AppHomeNavigation from "./AppHomeNavigation.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import * as m from "$paraglide/messages";

  export let data;
</script>

<!-- landing_intro -->

<SetPageTitle title="D-sektionen" />
<SEO
  data={{
    type: "website",
    props: {
      title: "D-sektionen",
      description: m.landing_intro(),
    },
  }}
  image={{
    url: "https://raw.githubusercontent.com/Dsek-LTH/grafik/refs/heads/main/guild/d_sektionen/full/color.svg",
    mime_type: "image/svg+xml",
    width: 400,
    height: 400,
    alt: "D-sektionen logo",
  }}
/>

<article class="flex flex-col gap-10">
  <section>
    <Articles news={data.news} />
  </section>

  <section>
    <Events events={data.events} />
  </section>

  <section>
    <CafeOpenTimes cafeOpen={data.cafeOpen} />
  </section>

  <section>
    <AppHomeNavigation />
  </section>

  <section>
    <WellbeingCta />
  </section>
  <section>
    <SRDCta />
  </section>

  <section>
    <Documents files={data.files} />
  </section>

  {#if data.commitCount && data.latestCommit}
    <section>
      <CodeWithDwww
        commitCount={data.commitCount}
        commitData={data.latestCommit}
      />
    </section>
  {/if}
</article>
