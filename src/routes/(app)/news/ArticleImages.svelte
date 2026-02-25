<script lang="ts">
	export let images: string[];
	export let header: string;
</script>

<div class="relative flex h-full w-full flex-col gap-2 p-1 hover:underline">
	<h1 class="text-left text-2xl font-bold">
		{header}
	</h1>
	<img
		src={images[0]}
		alt="header"
		class="h-full w-full rounded-lg object-cover"
	/>
	{#if images.length > 1}
		<p
			class="bg-base-200 absolute right-0 bottom-0 rounded-tl-full p-3 pt-6 pl-6"
		>
			{images.length}+
		</p>
	{/if}
</div>
