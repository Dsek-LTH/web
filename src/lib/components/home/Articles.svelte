<script lang="ts">
	import { markdownToTxt } from "markdown-to-txt";
	import * as m from "$paraglide/messages";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

	export let news: Array<
		Pick<ExtendedPrismaModel<"Article">, "header" | "body" | "slug">
	>;
</script>

<div
	class="border-t-secondary bg-base-300 rounded-t-xl border-t-4 p-4 text-2xl font-bold"
>
	<a href="/news" class="hover:underline">{m.news()}</a>
</div>
<div
	class="divide-base-100 grid grid-cols-1 flex-row rounded-b-xl sm:grid-cols-2 sm:divide-x-2 md:grid-cols-3 sm:[&>*:first-child]:rounded-bl-xl [&>*:last-child]:rounded-br-xl max-sm:[&>*:nth-child(2)]:rounded-b-xl sm:max-md:[&>*:nth-child(2)]:rounded-br-xl max-md:[&>*:nth-child(3)]:hidden"
>
	{#each news as article (article.slug)}
		<div class="pop-out bg-base-200 mt-0.5">
			<a href="/news/{article.slug}" class="flex h-full overflow-hidden p-4">
				<article>
					<h2 class="text-secondary mb-2 text-xl font-bold text-ellipsis">
						{article.header}
					</h2>
					<p class="line-clamp-3 flex-none leading-normal text-ellipsis">
						{markdownToTxt(article.body, { pedantic: true })}
					</p>
				</article>
			</a>
		</div>
	{/each}
</div>
