<script lang="ts">
	import QRCodeScanner from "$lib/components/QRCodeScanner.svelte";
	import { goto } from "$lib/utils/redirect";
	import { page } from "$app/stores";
	import type { PageData } from "./$types";
	import { relativeDate } from "$lib/utils/client/datetime";
	import { languageTag } from "$paraglide/runtime";
	import * as m from "$paraglide/messages";
	import { z } from "zod";

	export let data: PageData;
	const { event } = data;
	let error = "";

	function handleScan(qrCodeUuid: string) {
		// Navigate to the event scan page with the scanned QR code UUID
		const uuidSchema = z.string().uuid();
		const result = uuidSchema.safeParse(qrCodeUuid);

		if (result.success) {
			goto(`${$page.url.pathname}/${qrCodeUuid}`);
		} else {
			error = m.events_invalidQrCode();
		}
	}
</script>

<div class="container mx-auto max-w-3xl p-4">
	<div class="mb-8 text-center">
		<h1 class="mb-4 text-2xl font-bold">
			{m.events_scanning()}: {event.title}
		</h1>

		{#if event.imageUrl}
			<div class="mb-4 flex justify-center">
				<img
					src={event.imageUrl}
					alt={event.title}
					class="max-h-60 rounded-lg object-cover"
				/>
			</div>
		{/if}

		<div class="mb-4 text-sm opacity-80">
			{#if event.location}
				<div class="mb-1">{m.events_location()}: {event.location}</div>
			{/if}
			<div>
				<span class="font-semibold">{relativeDate(event.startDatetime)}</span>
				{event.startDatetime?.toLocaleTimeString([languageTag()], {
					hour: "2-digit",
					minute: "2-digit",
				})} →
				{event.endDatetime?.toLocaleTimeString([languageTag()], {
					hour: "2-digit",
					minute: "2-digit",
				})}
			</div>
		</div>
	</div>

	<div class="bg-base-200 mb-6 rounded-lg p-4">
		<h2 class="mb-2 text-xl font-semibold">{m.events_scanInstructions()}</h2>
		<p class="mb-2">{m.events_scanDescription()}</p>
		{#if error}
			<p class="alert alert-error mt-2 p-2">
				{error}
			</p>
		{/if}
	</div>

	<div class="flex justify-center">
		<QRCodeScanner onScan={handleScan} />
	</div>
</div>
