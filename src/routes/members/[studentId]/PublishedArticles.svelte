<script lang="ts">
  import type { Article } from "@prisma/client";
  import ActivityButton from "./ActivityButton.svelte";

  export let articles: Article[];
</script>

<h2 class="mb-2 text-lg">Publicerade nyheter</h2>
<div class="mb-4 flex flex-col gap-2">
  {#each articles as article (article.id)}
    <ActivityButton
      link="/news/{article.slug}"
      title={article.header}
      rightAdornment={article.publishedAt?.toLocaleDateString("sv") ?? ""}
    />
  {/each}
</div>
