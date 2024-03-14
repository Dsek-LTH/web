<script lang="ts">
  import MarkdownBody from "$lib/components/MarkdownBody.svelte";
  import type { Article } from "@prisma/client";

  export let news: Array<Pick<Article, "header" | "body" | "slug">>;
</script>

<ol
  class="flex flex-col divide-y divide-dashed divide-base-100 divide-opacity-50"
>
  {#each news as article (article.slug)}
    <li class="group relative py-5 text-base-100">
      <!-- svelte-ignore a11y-missing-content -->
      <a
        href="/news/{article.slug}"
        aria-hidden="true"
        class="absolute inset-0 z-0"
      />
      <a href="/news/{article.slug}">
        <h2 class="mb-2 text-xl font-bold group-hover:underline">
          {article.header}
        </h2>
      </a>
      <MarkdownBody
        wrappedLink
        body={article.body}
        class="
        line-clamp-2 text-ellipsis 
        leading-normal text-base-100 
        prose-headings:text-base prose-headings:text-base-100 
        prose-p:my-0 
        prose-a:z-10 prose-a:text-base-100 prose-a:underline hover:prose-a:text-base-100 hover:prose-a:no-underline 
        prose-strong:text-base-100
        md:line-clamp-3 lg:line-clamp-3 
        "
      />
    </li>
  {/each}
</ol>
