<script lang="ts">
	import dayjs from "dayjs";
	import * as m from "$paraglide/messages";
	import { eventLink } from "$lib/utils/redirect";
	import type { ConsumableWithMoreInfo } from "$lib/server/shop/inventory/types";
	import { getFileUrl } from "$lib/files/client";

	export let consumable: ConsumableWithMoreInfo;
	$: shoppable = consumable.shoppable;
	$: event = shoppable.event;
</script>

<div class="card card-compact bg-base-300 overflow-hidden shadow-xl">
	<a href={eventLink(event)} class="group">
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
				class="bg-base-100 bg-opacity-75 absolute inset-0 flex flex-col items-center justify-center"
			>
				<h6 class="text-xl font-semibold">{event.title}</h6>
				<span class="-mt-1 text-sm opacity-80">
					{dayjs(event.startDatetime).format("dddd Do MMM")}
				</span>
				<span class="mx-4 text-center">{event.shortDescription}</span>
				<span
					class="text-primary font-semibold underline underline-offset-8 transition-all group-hover:underline-offset-2 group-hover:opacity-80"
				>
					{m.inventory_goToEvent()}
				</span>

				<span class="absolute top-4 left-4">{event.organizer}</span>
				<span class="absolute top-4 right-4">{event.location}</span>
			</div>
		</figure>
	</a>
	<div class="card-body">
		<div class="flex items-start justify-between">
			<span class="card-title">
				{shoppable.title}
			</span>
		</div>
		{#if shoppable.description}
			<span>{shoppable.description}</span>
		{/if}
		<div class="card-actions items-end justify-between">
			<div class="text-sm opacity-50">
				{m.inventory_boughtAt()}
				{dayjs(consumable.purchasedAt).fromNow()}
			</div>
			<a href="inventory/{consumable.id}" class="btn btn-primary"
				>{m.inventory_showTicket()}</a
			>
		</div>
	</div>
</div>
