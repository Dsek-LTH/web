<script lang="ts">
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
	import * as m from "$paraglide/messages";
	export let upcoming: Pick<ExtendedPrismaModel<"Meeting">, "title"> | null;
	export let previous: Pick<ExtendedPrismaModel<"Meeting">, "title"> | null;
</script>

<a
	class="pop-out bg-base-300 flex gap-6 rounded-2xl px-5 py-3"
	href="/documents"
>
	<span class="i-mdi-gavel self-center text-2xl"></span>

	<article class="flex-1">
		<p>{m.home_meetingNext()}</p>
		<h2 class="text-xl font-bold">
			{#if upcoming}
				{upcoming.title}
			{:else}
				TBD
			{/if}
		</h2>
	</article>

	{#if previous}
		<article>
			<p class="font-light">{m.home_meetingPrev()}</p>
			<h2 class="text-xl font-light">
				{previous.title}
			</h2>
		</article>
	{/if}
</a>
