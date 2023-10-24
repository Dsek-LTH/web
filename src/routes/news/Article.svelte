<script lang="ts">
  import type { Article } from "./articles";
  import TagChip from "$lib/components/TagChip.svelte";
  import { marked } from "marked";

  export let article: Article;
</script>

<!-- {#if data.imageUrl}
  <figure>
    <img class="mx-auto" src={data.imageUrl} alt={data.header} />
  </figure>
{/if} -->

<h1 class="mb-8 text-2xl font-bold">{article.header}</h1>

<section class="flex items-center justify-between border-y border-gray-600 py-4">
  <div class="ml-4">
    <!-- <div class="avatar">
        <div class="w-16 rounded-full">
          <img src={article.author.member.picture_path} alt={article.author.member.first_name} />
        </div>
      </div> -->
    <p class="font-semibold">
      {article.author.member.firstName}
      {article.author.member.lastName}
    </p>
    {#if article.author.mandate?.position.name}
      <p class="font-thin text-primary">{article.author.mandate?.position.name}</p>
    {/if}
  </div>
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

<article class="prose lg:prose-xl">
  <!-- The article body is sanitized server-side. -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html marked(article.body)}
</article>
