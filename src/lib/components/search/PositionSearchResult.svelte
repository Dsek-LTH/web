<script lang="ts">
	import CommitteeIcon from "$lib/components/images/CommitteeIcon.svelte";
	import type { PositionSearchReturnAttributes } from "$lib/search/searchTypes";
	import { languageTag } from "$paraglide/runtime";

	export let position: PositionSearchReturnAttributes;
</script>

<li>
	<a
		href={"/positions/" + position.dsekId}
		class="search-result focus:border-primary border border-transparent"
	>
		{#if position.committee !== null}
			<div class="avatar aspect-square w-8 overflow-hidden rounded-full">
				<figure class="relative w-full">
					<CommitteeIcon committee={position.committee} />
				</figure>
			</div>
		{/if}
		<div>
			<h4>
				{languageTag() === "sv" ? position.nameSv : position.nameEn}
			</h4>
			<p class="line-clamp-1 text-gray-500">
				{languageTag() === "sv"
					? position.descriptionSv
					: position.descriptionEn}
			</p>
		</div>
	</a>
</li>
