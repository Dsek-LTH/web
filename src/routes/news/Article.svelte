<script lang="ts">
  import AuthorSignature from "$lib/components/AuthorSignature.svelte";
  import TagChip from "$lib/components/TagChip.svelte";
  import { marked } from "marked";
  import type { Article } from "./articles";

  export let article: Article;
</script>

<!-- {#if data.imageUrl}
  <figure>
    <img class="mx-auto" src={data.imageUrl} alt={data.header} />
  </figure>
{/if} -->

<h1 class="mb-8 text-2xl font-bold">{article.header}</h1>

<section class="flex items-center justify-between border-y border-gray-600 py-4">
  <AuthorSignature author={article.author} />
  <slot name="actions" />
</section>

<section class="flex flex-row items-center justify-between">
  <div class="flex flex-row flex-wrap gap-2">
    {#each article.tags as tag}
      <TagChip {tag} />
    {/each}
  </div>
  <p class="my-4 text-sm text-gray-600">
    Publicerad {article.publishedAt?.toLocaleDateString("sv")}
  </p>
</section>

<article class="prose-a prose lg:prose-xl prose-a:text-primary prose-a:no-underline">
  <!-- The article body is sanitized server-side. -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html marked(article.body)}
</article>
