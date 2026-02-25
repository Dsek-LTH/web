<script lang="ts">
	import MarkdownBody from "$lib/components/MarkdownBody.svelte";
	import * as m from "$paraglide/messages";
	import { languageTag } from "$paraglide/runtime";
	import Carousel from "$lib/components/Carousel.svelte";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

	export let article: ExtendedPrismaModel<"Article">;
</script>

{#if article.youtubeUrl}
	<figure>
		<iframe
			class="mx-auto aspect-video size-full"
			src={`https://www.youtube.com/embed/${article.youtubeUrl.split("=")[1]}`}
			title="Video"
		>
		</iframe>
	</figure>
{:else}
	<Carousel
		images={article.imageUrl === null
			? article.imageUrls
			: [...article.imageUrls, article.imageUrl]}
	/>
{/if}

<h1 class="mb-8 text-2xl font-bold">{article.header}</h1>

<section
	class="flex items-center justify-between border-y border-gray-600 py-4"
>
	<slot name="author" />
	<slot name="actions" />
</section>

<section class="flex flex-row items-center justify-between">
	<slot name="tags" />
	<p class="my-4 text-sm text-gray-600">
		{m.news_published({
			date: article.publishedAt?.toLocaleDateString(languageTag()) ?? "???",
		})}
	</p>
</section>

<MarkdownBody body={article.body} />

<slot name="after-body" />
