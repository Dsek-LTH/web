<script lang="ts">
	export let value: string | null | undefined = "";
	export let options: string[] = [];
	$: filteredItems = options.filter(
		(item) =>
			item.toLowerCase().includes(value?.toLowerCase() ?? "") && value !== item,
	);
</script>

<div class="dropdown">
	<input
		id="autocomplete"
		autocomplete="off"
		autocapitalize="off"
		type="text"
		class="input input-bordered hover:border-base-content w-full bg-transparent"
		bind:value
		{...$$restProps}
	/>

	{#if filteredItems.length !== 0}
		<ul
			tabindex={0}
			role="listbox"
			class="menu-compact menu dropdown-content join join-vertical border-primary bg-base-100 z-10 flex max-h-80 w-full flex-col flex-nowrap overflow-y-auto shadow"
			id="items-panel"
		>
			{#each filteredItems as item, i (i)}
				<li>
					<button
						type="button"
						class="join-item border-b-base-content/10 w-full border-b"
						on:click={() => (value = item)}
					>
						{item}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
