<script lang="ts">
  import { markdownToTxt } from "markdown-to-txt";
  import type { Article } from "@prisma/client";
  import * as m from "$paraglide/messages";

  export let news: Array<Pick<Article, "header" | "body" | "slug">>;
</script>

<div
  class="rounded-t-xl border-t-4 border-t-secondary bg-base-300 p-4 text-2xl font-bold"
>
  {m.news()}
</div>
<div
  class="grid grid-cols-1 flex-row divide-x-2 divide-base-100 rounded-b-xl sm:grid-cols-2 md:grid-cols-3 sm:[&>*:first-child]:rounded-bl-xl [&>*:last-child]:rounded-br-xl max-sm:[&>*:nth-child(2)]:rounded-b-xl sm:max-md:[&>*:nth-child(2)]:rounded-br-xl max-md:[&>*:nth-child(3)]:hidden"
>
  {#each news as article (article.slug)}
    <div class="mt-0.5 bg-base-200">
      <a
        href="/news/{article.slug}"
        class="pop-out flex h-full overflow-hidden p-4"
      >
        <article>
          <h2 class="mb-2 text-ellipsis text-xl font-bold text-secondary">
            {article.header}
          </h2>
          <p class="line-clamp-3 flex-none text-ellipsis leading-normal">
            {markdownToTxt(article.body, { pedantic: true })}
          </p>
        </article>
      </a>
    </div>
  {/each}
</div>
