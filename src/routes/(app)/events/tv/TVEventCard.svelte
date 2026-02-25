<script lang="ts">
	import { relativeDate } from "$lib/utils/client/datetime";
	import InterestedGoingList from "../InterestedGoingList.svelte";
	import MarkdownBody from "$lib/components/MarkdownBody.svelte";
	import type { EventWithIncludes } from "$lib/events/getEvents";
	import dayjs from "dayjs";

	export let event: EventWithIncludes;
	const dayjsDate = dayjs(event.startDatetime);
</script>

<article
	class="bg-base-200 row-span-2 grid grid-rows-subgrid gap-0 overflow-hidden rounded-xl"
>
	<div class="bg-base-300 flex justify-between gap-4 p-4">
		<div class="flex flex-wrap gap-2">
			{#each event.tags as tag}
				<span class="badge text-xs text-neutral-400">{tag.name}</span>
			{/each}
		</div>
	</div>

	<div class="flex flex-col p-8">
		<div class="flex flex-row items-center pb-4">
			<div class="bg-base-300 size-24 rounded-b-xl">
				<div
					class="bg-primary rounded-t-xl px-2 py-1 text-center font-bold text-black"
				>
					{dayjsDate.format("MMMM")}
				</div>
				<div class="px-5 py-2 text-center text-4xl font-bold">
					{dayjsDate.format("DD")}
				</div>
			</div>
			<h2 class="px-4 text-4xl font-bold">{event.title}</h2>
		</div>

		<section class="text-primary">
			{#if Math.abs(event.startDatetime.valueOf() - event.endDatetime.valueOf()) < 24 * 60 * 60 * 1000}
				<span class="font-semibold">{relativeDate(event.startDatetime)}</span>
				<br />
				{event.startDatetime?.toLocaleTimeString(["sv"], {
					hour: "2-digit",
					minute: "2-digit",
				})} →
				{event.endDatetime?.toLocaleTimeString(["sv"], {
					hour: "2-digit",
					minute: "2-digit",
				})}
			{:else}
				<div class="flex flex-row items-center gap-4">
					<div>
						<span class="font-semibold"
							>{relativeDate(event.startDatetime)}</span
						>
						<br />
						{event.startDatetime?.toLocaleTimeString(["sv"], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</div>
					→
					<div>
						<span class="font-semibold">{relativeDate(event.endDatetime)}</span>
						<br />
						{event.endDatetime?.toLocaleTimeString(["sv"], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</div>
				</div>
			{/if}
		</section>

		<div class="my-3 flex flex-col items-start gap-2">
			{#if event.shortDescription}
				<MarkdownBody
					body={event.shortDescription}
					class="mb-2 text-xl !leading-snug font-semibold"
				/>
			{/if}
			<MarkdownBody
				body={event.description}
				class="prose prose-xl prose-headings:text-sm mt-2 mb-8 line-clamp-5 min-w-full text-ellipsis"
			/>
		</div>
		<div class="my-3 flex flex-col items-start gap-0.5">
			<InterestedGoingList going={event.going} interested={event.interested} />
		</div>
	</div>
</article>
