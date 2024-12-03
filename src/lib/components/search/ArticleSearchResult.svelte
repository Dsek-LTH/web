<script lang="ts">
  import type { ArticleSearchReturnAttributes } from "$lib/search/searchTypes";
  import { languageTag } from "$paraglide/runtime";
  export let article: ArticleSearchReturnAttributes;
</script>

<li>
  <a
    href={"/news/" + article.slug}
    class="border border-transparent focus:border-primary"
  >
    <div class="avatar aspect-square w-8 overflow-hidden rounded-full">
      <span class="i-mdi-newspaper text-2xl"></span>
    </div>
    <div>
      <h4 class="text-balance">
        {#if languageTag() === "en"}
          {article.headerEn}
        {:else}
          {article.header}
        {/if}
      </h4>
      <p class="line-clamp-1 text-gray-500">
        {#if languageTag() === "en"}
          {article.bodyEn}
        {:else}
          {article.body}
        {/if}
      </p>
    </div>
  </a>
</li>
