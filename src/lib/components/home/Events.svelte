<script lang="ts">
	import { markdownToTxt } from "markdown-to-txt";
	import { languageTag } from "$paraglide/runtime";
	import * as m from "$paraglide/messages";
	import { eventLink } from "$lib/utils/redirect";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
	export let events: Array<
		Pick<
			ExtendedPrismaModel<"Event">,
			"id" | "slug" | "title" | "description" | "startDatetime"
		>
	>;
</script>

<div
	class="border-t-primary bg-base-300 rounded-t-xl border-t-4 p-4 text-2xl font-bold"
>
	<a href="/events" class="hover:underline">{m.events()}</a>
</div>
<div
	class="divide-base-100 grid flex-row sm:grid-cols-2 sm:divide-x-2 md:grid-cols-3 sm:[&>*:first-child]:rounded-bl-xl [&>*:last-child]:rounded-br-xl max-sm:[&>*:nth-child(2)]:rounded-b-xl sm:max-md:[&>*:nth-child(2)]:rounded-br-xl max-md:[&>*:nth-child(3)]:hidden"
>
	{#each events as event}
		<div class="pop-out bg-base-200 mt-0.5">
			<a
				href={eventLink(event)}
				class="flex h-full flex-col justify-start gap-x-5 p-4"
			>
				<div class="flex flex-row">
					<div
						class="bg-base-300 text-primary place-items-center rounded-l-lg px-4 py-2 text-center text-xl font-bold capitalize"
					>
						{event.startDatetime.toLocaleString(languageTag(), {
							weekday: "long",
						})}
					</div>
					<div
						class="bg-base-300/50 text-primary flex flex-1 items-center justify-center rounded-r-lg text-2xl font-semibold"
					>
						{event.startDatetime.toLocaleDateString("sv-SE", {
							day: "2-digit",
						}) +
							"/" +
							event.startDatetime.toLocaleDateString("sv-SE", {
								month: "2-digit",
							})}
					</div>
				</div>

				<div class="p-2">
					<h2 class="text-primary line-clamp-1 text-xl leading-snug font-bold">
						{event.title}
					</h2>
					<p class="line-clamp-3 leading-snug break-all text-ellipsis">
						{markdownToTxt(event.description, { pedantic: true })}
					</p>
				</div>
			</a>
		</div>
	{/each}
</div>
