<script lang="ts">
	import type { ArticleSearchReturnAttributes } from "$lib/search/searchTypes";
	import { languageTag } from "$paraglide/runtime";
	export let article: ArticleSearchReturnAttributes;
</script>

<li>
	<a
		href={"/news/" + article.slug}
		class="search-result focus:border-primary border border-transparent"
	>
		<div class="avatar aspect-square w-8 overflow-hidden rounded-full">
			<span class="i-mdi-newspaper text-2xl"></span>
		</div>
		<div>
			<h4 class="text-balance">
				{languageTag() === "sv" ? article.headerSv : article.headerEn}
			</h4>
			<p class="line-clamp-1 text-gray-500">
				{languageTag() === "sv" ? article.bodySv : article.bodyEn}
			</p>
		</div>
	</a>
</li>
