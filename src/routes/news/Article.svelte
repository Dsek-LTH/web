<script lang="ts">
  import type { Article } from "@prisma/client";
  import MarkdownBody from "../../lib/components/MarkdownBody.svelte";

  export let article: Article;
</script>

{#if article.imageUrl}
  <figure>
    <img class="mx-auto" src={article.imageUrl} alt={article.imageUrl} />
  </figure>
{/if}

<h1 class="mb-8 text-2xl font-bold">{article.header}</h1>

<section class="flex items-center justify-between border-y border-gray-600 py-4">
  <slot name="author" />
  <slot name="actions" />
</section>

<section class="flex flex-row items-center justify-between">
  <slot name="tags" />
  <p class="my-4 text-sm text-gray-600">
    Publicerad {article.publishedAt?.toLocaleDateString("sv")}
  </p>
</section>

<MarkdownBody body={article.body} />

<slot name="after-body" />
