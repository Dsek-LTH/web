<script lang="ts">
  import { page } from "$app/stores";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import TvArticleCard from "./TVArticleCard.svelte";
  import * as m from "$paraglide/messages";

  const data = $page.data;
</script>

<SetPageTitle title={m.news()} />

<section class="flex flex-col gap-8 space-y-4 px-14">
  {#each data["articles"] as article (article.id)}
    <TvArticleCard {article} />
  {/each}
</section>
