<script context="module" lang="ts">
	export type PolicyNode = {
		name: string;
		fullPath?: string;
		children: Record<string, PolicyNode>;
	};
</script>

<script lang="ts">
	import PolicyTreeNode from "./PolicyTreeNode.svelte";

	export let node: PolicyNode;
	export let depth = 0;

	export let showDelete = false;
	export let deleteAction: string | null = null;
	export let showEditLink = false;
	export let editHrefBase = "";

	const indent = depth * 1.25;

	const isLeaf = !!node.fullPath && Object.keys(node.children).length === 0;

	function capitalize(label: string) {
		return label.charAt(0).toUpperCase() + label.slice(1);
	}

	$: bgClass = isLeaf
		? "bg-base-100"
		: depth % 2 === 0
			? "bg-base-200"
			: "bg-base-200/60";
</script>

<div style="margin-left:{indent}rem" class="border-base-300 border-l pl-3">
	{#if isLeaf}
		<div class="flex items-center justify-between rounded {bgClass} px-3 py-2">
			<span class="font-semibold">
				{capitalize(node.name)}
				<span class="text-base-content/70 ml-2 font-mono text-sm font-normal">
					: {node.fullPath}
				</span>
			</span>

			{#if showEditLink && node.fullPath}
				<a class="btn btn-xs px-4" href="{editHrefBase}/{node.fullPath}">
					Edit
				</a>
			{/if}

			{#if showDelete && node.fullPath && deleteAction}
				<form method="POST" action={deleteAction}>
					<input type="hidden" name="policyId" value={node.fullPath} />
					<button type="submit" class="btn btn-xs">Delete</button>
				</form>
			{/if}
		</div>
	{:else}
		<details class="collapse-arrow collapse rounded {bgClass}">
			<summary class="collapse-title font-semibold">
				{capitalize(node.name)}
			</summary>

			<div class="collapse-content mt-2 space-y-2">
				{#each Object.values(node.children) as child}
					<PolicyTreeNode
						node={child}
						depth={depth + 1}
						{showDelete}
						{deleteAction}
						{showEditLink}
						{editHrefBase}
					/>
				{/each}
			</div>
		</details>
	{/if}
</div>
