<script lang="ts">
	import AuthorSignature from "$lib/components/socials/AuthorSignature.svelte";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

	let modal: HTMLDialogElement | null;
	export let members: Array<ExtendedPrismaModel<"Member">>;

	let clazz: string | undefined = undefined;
	export { clazz as class };

	let open = false;
	$: {
		if (open) modal?.showModal();
	}
</script>

{#if members.length > 0}
	<button
		on:click|preventDefault={() => {
			open = true;
		}}
		class={clazz}
	>
		<slot />
	</button>
	<dialog
		id="members_modal"
		class="modal"
		bind:this={modal}
		on:close={() => (open = false)}
		on:click={(e) => {
			if (e.target === modal) modal?.close();
		}}
	>
		{#if open}
			<ul class="modal-box m-1 flex flex-col">
				{#each members as liker (liker.id)}
					<li>
						<AuthorSignature type="member" lazy member={liker} />
					</li>
				{/each}
			</ul>
			<form method="dialog" class="modal-backdrop">
				<button>close</button>
			</form>
		{/if}
	</dialog>
{/if}
