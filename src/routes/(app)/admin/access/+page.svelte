<script lang="ts">
	import { superForm } from "$lib/utils/client/superForms";
	import type { PageData } from "./$types";
	import * as m from "$paraglide/messages";
	import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
	import SEO from "$lib/seo/SEO.svelte";
	import { writable, derived } from "svelte/store";
	import PolicyTreeNode from "$lib/components/access/PolicyTreeNode.svelte";
	import type { PolicyNode } from "$lib/components/access/PolicyTreeNode.svelte";

	export let data: PageData;

	const { form, errors, constraints, enhance } = superForm(data.form, {
		resetForm: true,
	});

	function insertPolicy(root: PolicyNode, policy: string) {
		const parts = policy.split(":");
		let node = root;

		parts.forEach((part, index) => {
			node.children[part] ??= {
				name: part,
				children: {},
			};

			node = node.children[part];

			if (index === parts.length - 1) {
				node.fullPath = policy;
			}
		});
	}

	const search = writable("");

	const filteredPolicies = derived(search, ($search) =>
		(data.accessPolicies ?? [])
			.filter((p): p is string => !!p)
			.filter((policy) => policy.toLowerCase().includes($search.toLowerCase())),
	);

	let policyTree: PolicyNode;

	$: policyTree = (() => {
		const root: PolicyNode = { name: "root", children: {} };

		$filteredPolicies.forEach((policy) => {
			insertPolicy(root, policy);
		});

		return root;
	})();
</script>

<SetPageTitle title="Access policies" />
<SEO
	data={{
		type: "website",
		props: {
			title: "Access policies",
		},
	}}
/>

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
	<table class="table">
		<thead>
			<tr class="bg-base-200">
				<th colspan="2">
					<a href="access/positions" class="link-primary mb-4">
						View Per Position
					</a>
				</th>
			</tr>
		</thead>

		<tbody>
			{#each Object.values(policyTree.children) as node}
				<tr>
					<td>
						<PolicyTreeNode {node} showEditLink editHrefBase="access" />
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<section class="my-4 space-y-4">
	<h2 class="text-xl font-bold">
		{m.admin_access_addNewPolicy()}
	</h2>

	<form class="form-control gap-4" method="POST" action="?/create" use:enhance>
		<label class="join join-vertical md:join-horizontal">
			<span class="label join-item bg-base-200 px-4">
				{m.admin_access_newPolicy()}
			</span>

			<input
				type="text"
				name="apiName"
				placeholder="Policy name"
				aria-invalid={$errors.apiName ? "true" : undefined}
				class="input join-item input-bordered input-primary md:flex-1"
				bind:value={$form.apiName}
				{...$constraints.apiName}
			/>

			{#if $errors.apiName}
				<span class="text-error">{$errors.apiName}</span>
			{/if}

			<button type="submit" class="btn btn-primary join-item">
				{m.admin_access_add()}
			</button>
		</label>
	</form>
</section>
