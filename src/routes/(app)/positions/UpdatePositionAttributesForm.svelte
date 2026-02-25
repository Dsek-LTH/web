<script lang="ts">
	import type { Position } from "@prisma/client";
	import Labeled from "$lib/components/Labeled.svelte";
	import type { UpdatePositionAttributeSchema } from "./+page.server";
	import type { SuperValidated } from "sveltekit-superforms";
	import { superForm } from "$lib/utils/client/superForms";
	import * as m from "$paraglide/messages";
	import apiNames from "$lib/utils/apiNames";
	import { isAuthorized } from "$lib/utils/authorization";
	import type { AuthUser } from "@zenstackhq/runtime";

	export let user: AuthUser;
	export let position: Position;
	export let data: SuperValidated<UpdatePositionAttributeSchema>;
	const { form, errors, constraints, isTainted, tainted, enhance } =
		superForm(data);
</script>

<form action="?/update" method="POST" style="display:contents" use:enhance>
	<input type="hidden" name="id" value={position.id} />
	{#if isAuthorized(apiNames.POSITION.SEE_INACTIVE, user)}
		<input type="hidden" name="active" value="false" />
		<Labeled label={m.positions_active()}>
			<input
				type="checkbox"
				name="active"
				id="active"
				value="active"
				bind:checked={$form.active}
				{...$constraints.active}
				required={false}
			/>
			{#if $errors.active}
				<p class="text-error">{$errors.active}</p>
			{/if}
		</Labeled>
	{/if}
	<input type="hidden" name="boardMember" value="false" />
	<Labeled label={m.positions_board_member()}>
		<input
			type="checkbox"
			name="boardMember"
			id="boardMember"
			value="boardMember"
			bind:checked={$form.boardMember}
			{...$constraints.boardMember}
			required={false}
		/>
		{#if $errors.boardMember}
			<p class="text-error">{$errors.boardMember}</p>
		{/if}
	</Labeled>
	<input
		type="submit"
		value={m.positions_apply_change()}
		disabled={!isTainted($tainted)}
		class="btn btn-secondary"
	/>
</form>
