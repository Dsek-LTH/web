<script lang="ts">
  import { markdownToTxt } from "markdown-to-txt";
  import type { Article } from "@prisma/client";

  export let news: Array<Pick<Article, "header" | "body" | "slug">>;
</script>

<ol
  class="flex flex-col divide-y divide-dashed divide-base-100 divide-opacity-50"
>
  {#each news as article (article.slug)}
    <li class="group py-5 text-black">
      <a href="/news/{article.slug}">
        <div>
          <h2 class="mb-2 text-xl font-bold group-hover:underline">
            {article.header}
          </h2>
          <p class="line-clamp-2 text-ellipsis leading-normal md:line-clamp-3">
            {markdownToTxt(article.body)}
          </p>
        </div>
      </a>
    </li>
  {/each}
</ol>
