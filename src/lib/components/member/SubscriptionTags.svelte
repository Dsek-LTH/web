<script lang="ts">
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

	export let subscribedTags: Array<ExtendedPrismaModel<"Tag">>;
	export let tags: Array<ExtendedPrismaModel<"Tag">>;

	let selectedTags: string[] = tags
		.map((tag) => {
			if (subscribedTags.find((subTag) => subTag.id == tag.id)) return tag.id;
			else return "";
		})
		.filter((t) => t != "");
</script>

<div class={"columns-1 items-center gap-5 sm:columns-2"}>
	{#each tags as tag}
		<div class="mx-2 mb-3 flex w-full justify-self-center">
			<label
				class="flex w-full max-w-full cursor-pointer items-center justify-between rounded-2xl border pl-2"
				style={"border-color: " + tag.color + ";"}
			>
				<input
					type="checkbox"
					class="peer sr-only"
					name="tag"
					bind:group={selectedTags}
					value={tag.id}
				/>
				<span
					class="ms-3 box-border max-w-80 pt-1 pb-1 text-left text-sm font-medium break-words xl:max-w-44"
				>
					{tag.name}
				</span>
				<div
					class="peer peer-checked:bg-primary relative mr-1 ml-2 h-5 w-9 rounded-full bg-gray-300 pr-9 peer-focus:ring-4 peer-focus:ring-gray-400 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-gray-800"
				></div>
			</label>
		</div>
	{/each}
</div>
