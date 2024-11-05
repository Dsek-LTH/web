<script lang="ts">
  import type { Article } from "@prisma/client";
  import ActivityButton from "./ActivityButton.svelte";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";

  export let articles: Article[];
</script>

<h2 class="mb-2 text-lg">{m.members_publishedArticles()}</h2>
<div class="mb-4 flex flex-col gap-2">
  {#each articles as article (article.id)}
    <ActivityButton
      link="/news/{article.slug}"
      title={article.header}
      rightAdornment={article.publishedAt?.toLocaleDateString(languageTag()) ??
        ""}
    />
  {/each}
</div>
