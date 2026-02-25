<script lang="ts">
	import dayjs from "dayjs";
	import * as m from "$paraglide/messages";
	export let commitCount: string;
	export let commitData: {
		author: string;
		message: string;
		avatarUrl: string;
		date: string;
		url: string;
	};

	const commitMessageHeader = commitData.message.split("\n")[0];
</script>

<div
	class="border-t-primary bg-base-300 rounded-t-xl border-t-4 p-4 text-2xl font-bold"
>
	<a href="https://github.com/Dsek-LTH/web" class="hover:underline"
		>{m.home_codeWithDWWW()}</a
	>
</div>
<div class="bg-base-200 flex flex-col rounded-b-xl p-4">
	{m.home_DWWWMessage()}
	<div class="flex flex-wrap justify-between pt-4">
		<a class="btn btn-ghost btn-sm" href="https://github.com/Dsek-LTH/web"
			><span class="i-mdi-github text-primary text-lg"></span> Github</a
		>
		<a
			class="btn btn-ghost btn-sm"
			href="https://github.com/Dsek-LTH/web/issues/new/choose"
			><span class="i-mdi-bug text-primary text-lg"></span>
			{m.home_reportBug()}</a
		>
		<a
			class="btn btn-ghost btn-sm"
			href="https://github.com/Dsek-LTH/web/commits/main/"
			><span class="i-mdi-history text-primary text-lg"></span>Commits: {commitCount}</a
		>
	</div>
	<a
		href={commitData.url}
		class="bg-base-300 hover:bg-base-100 m-2 flex flex-col rounded-xl p-3 sm:flex-row sm:items-center"
	>
		<div class="flex flex-row items-center">
			<img
				class="mr-2 max-w-8 rounded-2xl"
				src={commitData.avatarUrl}
				alt="latest commiters avatar"
			/>
			<span class="font-semibold">{commitData.author}</span>
		</div>
		<span class="ml-2 line-clamp-2 text-sm">{commitMessageHeader}</span>
		<span class="ml-auto pl-2 text-right text-sm font-light whitespace-nowrap"
			>{dayjs(commitData.date).fromNow()}</span
		>
	</a>
</div>
