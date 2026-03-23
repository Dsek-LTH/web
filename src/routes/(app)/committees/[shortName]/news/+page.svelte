<script lang="ts">
  import type { CommitteeLoadData } from "../../committee.server";
  import type { PageData } from "./$types";
  import ArticleCard from "$lib/components/ArticleCard.svelte";

  import * as m from "$paraglide/messages";

  let { data }: { data: CommitteeLoadData & PageData } = $props();
</script>

<h2>{m.committees_news()}</h2>

<div class="mt-4 flex flex-row gap-4">
  <div class="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
    {#each data.articles as article, index (article.id)}
      <ArticleCard {article} {index} />
    {/each}
  </div>
</div>
