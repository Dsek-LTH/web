<script lang="ts">
  import type { ArticleSearchReturnAttributes } from "$lib/search/searchTypes";
  export let article: ArticleSearchReturnAttributes;
</script>

<li>
  <a
    href={"/news/" + article.slug}
    class="border border-transparent focus:border-primary"
    id=".search-result"
  >
    <div class="avatar aspect-square w-8 overflow-hidden rounded-full">
      <span class="i-mdi-newspaper text-2xl"></span>
    </div>
    <div>
      <h4 class="text-balance">
        {article.header}
      </h4>
      <p class="line-clamp-1 text-gray-500">
        {article.body}
      </p>
    </div>
  </a>
</li>
