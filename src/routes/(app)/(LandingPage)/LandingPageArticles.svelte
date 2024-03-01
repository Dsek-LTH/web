<script lang="ts">
  import type { Article } from "@prisma/client";
  import { marked } from "marked";

  export let news: Pick<Article, "header" | "body" | "slug">[];
</script>

<ol class="flex flex-col divide-y divide-dotted divide-stone-700">
  {#each news as article}
    <li class="py-5 text-black">
      <a href="/news/{article.slug}" class="group">
        <h2 class="mb-2 text-xl font-bold group-hover:underline">
          {article.header}
        </h2>
        <p class="line-clamp-3 break-words">
          <!-- eslint-disable-next-line svelte/no-at-html-tags - Sanitized server-side -->
          {@html marked(article.body, {
            async: false,
          })}
        </p>
      </a>
    </li>
  {/each}
</ol>
