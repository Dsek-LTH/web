<script lang="ts">
	import type { EventSearchReturnAttributes } from "$lib/search/searchTypes";
	import { languageTag } from "$paraglide/runtime";
	export let event: EventSearchReturnAttributes;
</script>

<li>
	<a
		href={"/events/" + event.slug}
		class="search-result focus:border-primary border border-transparent"
	>
		<div class="avatar aspect-square w-8 overflow-hidden rounded-full">
			<span class="i-mdi-calendar text-2xl"></span>
		</div>
		<div>
			<h4>
				{languageTag() === "sv" ? event.titleSv : event.titleEn}
			</h4>
			<p class="line-clamp-1 text-gray-500">
				{languageTag() === "sv" ? event.descriptionSv : event.descriptionEn}
			</p>
		</div>
	</a>
</li>
