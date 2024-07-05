<script lang="ts">
  import { page } from "$app/stores";
  import TvArticleCard from "./TVArticleCard.svelte";

  const data = $page.data;
</script>

<section class="flex flex-col gap-8 space-y-4 px-14">
  {#each data["articles"] as article (article.id)}
    <TvArticleCard {article} />
  {/each}
</section>
