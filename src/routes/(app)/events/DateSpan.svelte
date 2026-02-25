<script lang="ts">
	import { relativeDate } from "$lib/utils/client/datetime";
	import { languageTag } from "$paraglide/runtime";

	export let start: Date;
	export let end: Date | undefined = undefined;
</script>

<div class="text-primary">
	{#if end == undefined}
		<span class="font-semibold">{relativeDate(start)}</span> <br />
		{start?.toLocaleTimeString([languageTag()], {
			hour: "2-digit",
			minute: "2-digit",
		})}
	{:else if Math.abs(start.valueOf() - end.valueOf()) < 24 * 60 * 60 * 1000}
		<span class="font-semibold">{relativeDate(start)}</span> <br />
		{start?.toLocaleTimeString([languageTag()], {
			hour: "2-digit",
			minute: "2-digit",
		})} →
		{end?.toLocaleTimeString([languageTag()], {
			hour: "2-digit",
			minute: "2-digit",
		})}
	{:else}
		<div class="flex flex-row items-center gap-4">
			<div>
				<span class="font-semibold">{relativeDate(start)}</span> <br />
				{start?.toLocaleTimeString([languageTag()], {
					hour: "2-digit",
					minute: "2-digit",
				})}
			</div>
			→
			<div>
				<span class="font-semibold">{relativeDate(end)}</span> <br />
				{end?.toLocaleTimeString([languageTag()], {
					hour: "2-digit",
					minute: "2-digit",
				})}
			</div>
		</div>
	{/if}
</div>
