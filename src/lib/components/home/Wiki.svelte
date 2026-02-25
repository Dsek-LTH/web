<script lang="ts">
	import { PUBLIC_MEDIAWIKI_ENDPOINT } from "$env/static/public";
	import type { WikiDataItem } from "$lib/server/wiki/wiki";
	import dayjs from "dayjs";

	let { items }: { items: WikiDataItem[] } = $props();

	let wikiUrl = $derived(new URL(PUBLIC_MEDIAWIKI_ENDPOINT).origin);
</script>

<div
	class="border-t-secondary bg-base-300 rounded-t-xl border-t-4 p-4 text-2xl font-bold"
>
	<a href={wikiUrl} class="hover:underline">Wiki</a>
</div>
<div
	class="divide-base-100 grid grid-cols-1 flex-row rounded-b-xl sm:grid-cols-2 sm:divide-x-2 md:grid-cols-3 sm:[&>*:first-child]:rounded-bl-xl [&>*:last-child]:rounded-br-xl max-sm:[&>*:nth-child(2)]:rounded-b-xl sm:max-md:[&>*:nth-child(2)]:rounded-br-xl max-md:[&>*:nth-child(3)]:hidden"
>
	{#each items as item (item.revid)}
		{@const date = new Date(item.timestamp)}
		<div class="pop-out bg-base-200 mt-0.5">
			<a
				href="{wikiUrl}/index.php?title=Special:Login&returnto={item.title}"
				class="flex h-full overflow-hidden p-4"
			>
				<article class="flex flex-col justify-between">
					<section>
						<h2 class="text-secondary mb-2 text-xl font-bold text-ellipsis">
							{item.title}
						</h2>
						<p class="line-clamp-3 flex-none leading-normal text-ellipsis">
							{item.extract}
						</p>
					</section>
					<footer>
						<p
							class="my-1 self-end text-xs font-light text-nowrap text-neutral-600"
						>
							{item.user.toLowerCase()}
							{#if dayjs(date).diff(dayjs(), "week") < -1}
								{dayjs(date).format("YYYY-MM-DD")}
							{:else}
								{dayjs(date).fromNow()}
							{/if}
						</p>
					</footer>
				</article>
			</a>
		</div>
	{/each}
</div>
