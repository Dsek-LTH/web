<script lang="ts">
	import { superForm } from "$lib/utils/client/superForms";
	import PolicyTreeNode from "$lib/components/access/PolicyTreeNode.svelte";
	import type { PolicyNode } from "$lib/components/access/PolicyTreeNode.svelte";
	import { writable, derived } from "svelte/store";

	let { data } = $props();

	const search = writable("");

	// Filtered trees, reactive to search
	const filteredPosTrees = derived(search, ($search) => {
		const q = $search.toLowerCase().trim();

		return Array.from(data.posToAccessPolicies.entries())
			.sort((a, b) => (a[0] < b[0] ? -1 : 1))
			.map(([position, policies]) => {
				const positionMatches = position.toLowerCase().includes(q);

				const visibleApiNames = positionMatches
					? policies.map((p) => p.apiName)
					: policies
							.filter((p) => p.apiName.toLowerCase().includes(q))
							.map((p) => p.apiName);

				return {
					position,
					policies,
					tree: buildPolicyTreeForPolicies(visibleApiNames),
				};
			})
			.filter(({ tree }) => Object.keys(tree).length > 0);
	});

	const {
		form: createForm,
		errors: createErrors,
		constraints: createFormConstraints,
		enhance: createFormEnhance,
	} = superForm(data.createForm);

	function insertPolicy(root: PolicyNode, policy: string) {
		const parts = policy.split(":");
		let node = root;

		parts.forEach((part, index) => {
			node.children[part] ??= { name: part, children: {} };
			node = node.children[part];

			if (index === parts.length - 1) {
				node.fullPath = policy;
			}
		});
	}

	function buildPolicyTreeForPolicies(
		policies: string[],
	): Record<string, PolicyNode> {
		const root: PolicyNode = { name: "root", children: {} };
		policies.forEach((p) => insertPolicy(root, p));
		return root.children; // return children instead of the root node
	}
</script>

<!-- Search -->
<div class="mb-4 flex items-center gap-2">
	<input
		type="text"
		placeholder="Search policies..."
		class="input input-bordered w-full max-w-md"
		bind:value={$search}
	/>

	{#if $search}
		<button class="btn btn-sm" onclick={() => search.set("")}> Clear </button>
	{/if}
</div>

<div class="overflow-x-auto">
	<table class="table w-full">
		<thead>
			<tr class="bg-base-200">
				<th colspan="2">
					<a href="." class="link-primary mb-4"> View Per API-Name </a>
				</th>
			</tr>
			<tr class="bg-base-200">
				<th>Role / Position</th>
				<th>Access Policies</th>
			</tr>
		</thead>

		<tbody>
			{#each $filteredPosTrees as { position, tree, policies }}
				<tr class="odd:bg-gray/10 even:bg-base-200/50">
					<td class="font-medium">{position}</td>
					<td>
						{#if policies.length > 0}
							<details class="collapse-arrow bg-base-200/50 collapse rounded">
								<summary class="collapse-title font-semibold">
									{position} ({policies.length} policies)
								</summary>

								<div class="collapse-content mt-2 space-y-2">
									{#each Object.values(tree) as node}
										<PolicyTreeNode
											{node}
											showDelete
											deleteAction="?/deletePolicy"
										/>
									{/each}

									<form
										method="POST"
										action="?/createPolicy"
										class="mt-2"
										use:createFormEnhance
									>
										<input type="hidden" name="position" value={position} />
										<input
											type="text"
											name="apiName"
											placeholder="Policy name"
											aria-invalid={$createErrors.apiName ? "true" : undefined}
											class="input input-bordered input-primary w-full max-w-md"
											bind:value={$createForm.apiName}
											{...$createFormConstraints.apiName}
										/>
										<button type="submit" class="btn btn-primary mt-2"
											>Add Policy</button
										>
									</form>
								</div>
							</details>
						{:else}
							<details class="collapse-arrow bg-base-200/50 collapse rounded">
								<summary class="collapse-title font-semibold"
									>{position} (0 policies)</summary
								>
								<div class="collapse-content mt-2 space-y-2">
									<span class="text-sm text-gray-500">No policies</span>

									<form
										method="POST"
										action="?/createPolicy"
										class="mt-2"
										use:createFormEnhance
									>
										<input type="hidden" name="position" value={position} />
										<input
											type="text"
											name="apiName"
											placeholder="Policy name"
											aria-invalid={$createErrors.apiName ? "true" : undefined}
											class="input input-bordered input-primary w-full max-w-md"
											bind:value={$createForm.apiName}
											{...$createFormConstraints.apiName}
										/>
										<button type="submit" class="btn btn-primary mt-2"
											>Add Policy</button
										>
									</form>
								</div>
							</details>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
