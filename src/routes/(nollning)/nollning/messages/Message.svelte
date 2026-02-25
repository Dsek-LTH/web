<script lang="ts">
	import MarkdownBody from "$lib/components/MarkdownBody.svelte";
	import { page } from "$app/stores";
	import dayjs from "dayjs";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
	$: revealTheme = $page.data["revealTheme"];
	export let message: ExtendedPrismaModel<"Article"> & {
		author: ExtendedPrismaModel<"Author"> & {
			member: ExtendedPrismaModel<"Member">;
			mandate:
				| (ExtendedPrismaModel<"Mandate"> & {
						position: ExtendedPrismaModel<"Position">;
				  })
				| null;
			customAuthor: ExtendedPrismaModel<"CustomAuthor"> | null;
		};
	};
	$: author = message.author;
	$: authorName =
		author.type === "Custom"
			? (author.customAuthor?.name ?? "Staben")
			: `${author.member.firstName}${author.mandate?.position ? `, ${author.mandate?.position?.name}` : ""}`;
</script>

<article>
	<div class="text-base-content mb-1 font-medium uppercase">
		<!-- less than a week ago -->
		{dayjs(new Date(message.publishedAt ?? message.createdAt)).fromNow()}
		<!-- {#if dayjs(new Date()).diff(new Date(message.publishedAt), "day") < 7}
      {dayjs(new Date(message.publishedAt)).format("ddd HH:mm")}
    {:else}
      {dayjs(new Date(message.publishedAt)).format("DD MMM HH:mm")}
    {/if} -->
	</div>
	<div
		class="rounded-btn {revealTheme
			? 'bg-[#ECDDBC]'
			: 'border-base-200 bg-base-100 border-2'}  p-4"
	>
		<h2 class=" text-secondary text-xl">{message.header}</h2>
		<h5 class="text-base-content mb-2 font-medium">{authorName}</h5>
		<MarkdownBody body={message.body} class="leading-tight" />
	</div>
</article>
