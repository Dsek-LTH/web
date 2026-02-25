<script lang="ts">
	import { onMount } from "svelte";

	let modal: HTMLDialogElement;
	let mounted = false;
	export let show: boolean;
	export let backdrop = false;
	export let onClose: (() => void) | undefined = undefined;

	onMount(() => {
		mounted = true;
	});

	$: if (mounted && modal) {
		if (show) {
			modal.showModal();
		} else {
			modal.close();
		}
	}
</script>

<dialog class="modal" bind:this={modal}>
	<div class="modal-box">
		<slot />
	</div>
	{#if backdrop}
		{#if onClose}
			<form
				method="dialog"
				class="modal-backdrop"
				on:submit|preventDefault={onClose}
			>
				<button>close</button>
			</form>
		{:else}
			<form method="dialog" class="modal-backdrop">
				<button>close</button>
			</form>
		{/if}
	{/if}
</dialog>
