<script lang="ts">
	import AuthorSignature from "$lib/components/socials/AuthorSignature.svelte";
	import * as m from "$paraglide/messages";
	import {
		formatGoingList,
		formatInterestedList,
	} from "$lib/events/pluralization";
	import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

	let goingModal: HTMLDialogElement;
	let interestedModal: HTMLDialogElement;
	export let interested: Array<ExtendedPrismaModel<"Member">>;
	export let going: Array<ExtendedPrismaModel<"Member">>;

	$: goingText = formatGoingList(going);

	$: interestedText = formatInterestedList(interested);
</script>

{#if going.length > 0}
	<button
		on:click|preventDefault={() => goingModal.showModal()}
		class="link text-sm opacity-40 hover:opacity-60"
	>
		{goingText}
	</button>
	<dialog id="going_modal" class="modal" bind:this={goingModal}>
		<ul class="modal-box m-1 flex flex-col">
			{#each going as person (person.id)}
				<li>
					<AuthorSignature lazy type="member" member={person} />
				</li>
			{/each}
		</ul>
		<form method="dialog" class="modal-backdrop">
			<button>{m.events_interestedGoing_close()}</button>
		</form>
	</dialog>
{/if}
{#if going.length > 0 && interested.length > 0}
	<br />
{/if}
{#if interested.length > 0}
	<button
		on:click|preventDefault={() => interestedModal.showModal()}
		class="link text-sm opacity-40 hover:opacity-60"
	>
		{interestedText}
	</button>
	<dialog id="interested_modal" class="modal" bind:this={interestedModal}>
		<ul class="modal-box m-1 flex flex-col">
			{#each interested as person (person.id)}
				<li>
					<AuthorSignature lazy type="member" member={person} />
				</li>
			{/each}
		</ul>
		<form method="dialog" class="modal-backdrop">
			<button>{m.events_interestedGoing_close()}</button>
		</form>
	</dialog>
{/if}
