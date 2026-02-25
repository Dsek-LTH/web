<script lang="ts">
	import ClassBadge from "$lib/components/ClassBadge.svelte";
	import MemberAvatar from "$lib/components/socials/MemberAvatar.svelte";
	import UpdateMandateForm from "./UpdateMandateForm.svelte";
	import DeleteMandateForm from "./DeleteMandateForm.svelte";
	import apiNames from "$lib/utils/apiNames";
	import { isAuthorized } from "$lib/utils/authorization";
	import { getFullName } from "$lib/utils/client/member";
	import { languageTag } from "$paraglide/runtime";
	import type { PageData } from "./$types";
	import { onMount } from "svelte";
	export let data: PageData;
	export let mandate: PageData["mandates"][0];

	let isEditing = false;
	let container: Node;

	onMount(() =>
		document.addEventListener("pointerdown", (event) => {
			if (!container?.contains(event.target as Node)) {
				isEditing = false;
			}
		}),
	);

	$: startDate = mandate.startDate.toLocaleDateString(languageTag());
	$: endDate = mandate.endDate.toLocaleDateString(languageTag());
</script>

<div
	bind:this={container}
	class="tooltip relative flex items-center gap-2 before:whitespace-pre"
	data-tip={isEditing
		? undefined // remove tooltip when editing
		: getFullName(mandate.member) + `\n${startDate} - ${endDate}`}
>
	<a
		href="/members/{mandate.member.studentId}"
		class="flex flex-1 place-items-center gap-2 overflow-hidden normal-case"
	>
		<MemberAvatar member={mandate.member} />
		<span
			class="flex-1 overflow-hidden text-left font-medium text-ellipsis whitespace-nowrap"
		>
			{getFullName(mandate.member)}
		</span>
	</a>
	<ClassBadge member={mandate.member} />

	<!-- Edit button -->
	{#if isAuthorized(apiNames.MANDATE.UPDATE, data.user) || isAuthorized(apiNames.MANDATE.DELETE, data.user)}
		<button
			class="aspect-square h-2/3"
			on:click={() => (isEditing = !isEditing)}
			><span
				class="h-full w-full {isEditing
					? 'i-mdi-close opacity-80'
					: 'i-mdi-pencil opacity-20'} transition-opacity hover:opacity-100"
				>edit</span
			></button
		>
	{/if}

	<!-- Edit modal -->
	{#if isEditing}<div
			class="bg-base-100 absolute top-full z-10 w-full rounded-lg p-2"
			style="box-shadow: inset 0 -2px 4px 0 oklch(from white l c h / 0.1), inset 0 2px 4px 0 oklch(from black l c h / 0.3);"
		>
			{#await data.updateMandateForm then form}
				<UpdateMandateForm
					data={((f) => {
						// This works well enough
						f.data.startDate = mandate.startDate;
						f.data.endDate = mandate.endDate;
						f.data.mandateId = mandate.id;
						return f;
					})(form)}
				/>
			{/await}
			{#if isAuthorized(apiNames.MANDATE.DELETE, data.user)}
				{#await data.deleteMandateForm then form}
					<DeleteMandateForm mandateId={mandate.id} data={form} />
				{/await}
			{/if}
			<span class="text-xs">
				{startDate} - {endDate}
			</span>
		</div>{/if}
</div>
