<script lang="ts">
	import { getFileUrl } from "$lib/files/client";
	import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";
	import dayjs from "dayjs";

	export let event: TicketWithMoreInfo["event"];
	$: date = dayjs(event.startDatetime);
</script>

<figure class="relative aspect-video">
	<img
		src={getFileUrl(
			event.imageUrl ??
				"minio/news/public/8c97c4c6-d4f4-44f5-9658-cff70110ad85.webp",
		)}
		alt="{event.title} cover photo"
		class="aspect-video object-cover"
	/>
	<div
		class="bg-base-100 bg-opacity-75 absolute inset-0 flex flex-col items-center justify-center transition-all group-hover:opacity-100 md:opacity-0"
	>
		<h6 class="text-xl font-semibold">{event.title}</h6>
		<h6 class="-mt-1 text-sm opacity-80">
			{#if date.year() === new Date().getFullYear()}
				{date.format("dddd Do MMM")}
			{:else}
				{date.format("dddd Do MMM, YYYY")}
			{/if}
		</h6>
		<h6 class="mx-4 text-center">{event.shortDescription}</h6>

		<h6 class="absolute top-4 left-4">{event.organizer}</h6>
		<h6 class="absolute top-4 right-4">{event.location}</h6>
	</div>
</figure>
