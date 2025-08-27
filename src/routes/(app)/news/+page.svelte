<script lang="ts">
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import * as Card from "$lib/components/ui/card/index.js";

  let { data } = $props();
</script>

<SetPageTitle title={m.news()} />
<SEO
  data={{
    type: "website",
    props: {
      title: "D-sektionen",
      description: m.landing_intro(),
    },
  }}
/>

<div class="space-y-4">
  <section class="grid grid-cols-1 gap-8 p-16 md:grid-cols-2">
    {#each data.articles as article (article.id)}
      <Card.Root class="w-5/6 p-6">
        <h1 class="line-clamp-1 text-3xl font-bold">
          {article.header}
        </h1>
        <div class="line-clamp-4">
          {article.body}
        </div>
      </Card.Root>
    {/each}
  </section>
</div>
