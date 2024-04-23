<script lang="ts">
  import { markdownToTxt } from "markdown-to-txt";
  import type { Article } from "@prisma/client";

  export let news: Array<Pick<Article, "header" | "body" | "slug">>;
</script>

<ol class="flex flex-col gap-4">
  {#each news as article (article.slug)}
    <li>
      <article class="pop-out rounded-2xl bg-base-300 p-4">
        <a href="/news/{article.slug}">
          <h2 class="mb-2 text-xl font-bold text-primary">
            {article.header}
          </h2>
          <p class="line-clamp-2 text-ellipsis leading-normal md:line-clamp-3">
            {markdownToTxt(article.body)}
          </p>
        </a>
      </article>
    </li>
  {/each}
</ol>
