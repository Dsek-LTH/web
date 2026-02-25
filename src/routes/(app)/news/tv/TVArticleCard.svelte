<script lang="ts">
	import { getFullName } from "$lib/utils/client/member";
	import type { Article } from "$lib/news/getArticles";
	import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
	import dayjs from "dayjs";
	import MarkdownBody from "$lib/components/MarkdownBody.svelte";
	export let article: Article;
</script>

<article
	class="bg-base-200 row-span-2 grid grid-rows-subgrid gap-0 overflow-hidden rounded-xl"
>
	<div class="bg-base-300 flex justify-between gap-4 p-4">
		<div class="flex flex-wrap gap-2">
			{#each article.tags as tag}
				<span class="badge text-xs text-neutral-600">{tag.name}</span>
			{/each}
		</div>
	</div>

	<div class="overflow flex flex-col p-8">
		<div class="flex-1">
			<h1 class="text-2xl font-bold group-hover:underline">
				{article.header}
			</h1>
			<MarkdownBody
				body={article.body}
				class="prose prose-xl prose-headings:text-sm mt-2 mb-8 line-clamp-5 min-w-full text-ellipsis"
			/>
		</div>

		<div class="flex gap-4">
			<a href={"members/" + article.author.member.studentId}>
				<MemberAvatar
					class="size-10 hover:opacity-60"
					member={article.author.member}
				/>
			</a>
			<div class="flex w-full items-center justify-between gap-4">
				<div>
					<a href={"members/" + article.author.member.studentId}>
						<h2 class="text-primary text-sm font-semibold hover:underline">
							{getFullName(article.author.member)}
						</h2>
					</a>
					{#if article.author.mandate}
						<a href={"positions/" + article.author.mandate.position.id}>
							<p class="my-1 text-xs font-light hover:underline">
								{article.author.mandate.position.name}
							</p>
						</a>
					{/if}
				</div>
				<p
					class="my-1 self-end text-xs font-light text-nowrap text-neutral-600"
				>
					{#if dayjs(article.createdAt).diff(dayjs(), "week") < -1}
						{dayjs(article.createdAt).format("YYYY-MM-DD")}
					{:else}
						{dayjs(article.createdAt).fromNow()}
					{/if}
				</p>
			</div>
		</div>
	</div>
</article>
