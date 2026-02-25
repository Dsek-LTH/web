<script lang="ts">
	import { enhance } from "$app/forms";
	import MemberSearchInput from "$lib/components/forms/MemberSearchInput.svelte";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

	export let year: number | undefined = undefined;
	export let phadder = false;
	export let groupId: string;
	let member: ExtendedPrismaModel<"Member"> | undefined = undefined;
</script>

<form
	action="?/{phadder ? 'addPhadder' : 'addNolla'}"
	use:enhance={() => {
		return ({ update }) => {
			update();
			member = undefined;
		};
	}}
	method="POST"
	class="mt-2 flex gap-2"
>
	{#if member}
		<input type="hidden" name="memberId" value={member.id} />
	{/if}
	<MemberSearchInput
		bind:member
		class="flex-1"
		endpoint={phadder ? "/api/members/phadders" : undefined}
		{year}
	/>
	<button type="submit" disabled={!member} class="btn btn-primary">+</button>
	<input type="hidden" name="groupId" value={groupId} />
</form>
