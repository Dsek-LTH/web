<script lang="ts">
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
	import * as m from "$paraglide/messages";

	export let cafeOpen: Pick<ExtendedPrismaModel<"Markdown">, "markdown"> | null;
</script>

<a
	class="pop-out bg-base-300 flex gap-6 rounded-2xl px-6 py-3"
	href="/committees/cafe"
>
	<span class="i-mdi-coffee text-secondary lg:text-primary self-center text-2xl"
	></span>

	<article>
		<p>{m.home_cafeOpenHours()}</p>
		<h2 class="text-secondary lg:text-primary text-xl font-bold">
			{#if cafeOpen}
				{cafeOpen.markdown}
			{:else}
				N/A
			{/if}
		</h2>
	</article>
</a>
