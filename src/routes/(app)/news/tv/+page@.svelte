<script lang="ts">
  import { page } from "$app/stores";
  import TvArticleCard from "./TVArticleCard.svelte";

  const data = $page.data;
</script>

<div class="space-y-4 px-14">
  <section class="flex flex-col gap-8">
    {#each data["articles"] as article (article.id)}
      <TvArticleCard {article} />
    {/each}
  </section>
</div>
