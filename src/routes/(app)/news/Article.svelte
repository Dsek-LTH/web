<script lang="ts">
  import type { Article } from "@prisma/client";
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";
  import { getFileUrl } from "$lib/files/client";

  export let article: Article;
</script>

{#if article.imageUrl}
  <figure>
    <img
      class="mx-auto"
      src={getFileUrl(article.imageUrl)}
      alt={article.imageUrl}
    />
  </figure>
{/if}

<h1 class="mb-8 text-2xl font-bold">{article.header}</h1>

<section
  class="flex items-center justify-between border-y border-gray-600 py-4"
>
  <slot name="author" />
  <slot name="actions" />
</section>

<section class="flex flex-row items-center justify-between">
  <slot name="tags" />
  <p class="my-4 text-sm text-gray-600">
    {m.news_published({
      date: article.publishedAt?.toLocaleDateString(languageTag()) ?? "???",
    })}
  </p>
</section>

<MarkdownBody body={article.body} />

<slot name="after-body" />
