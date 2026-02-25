<script lang="ts">
	import { enhance } from "$app/forms";
	import BuyButton from "$lib/components/BuyButton.svelte";
	import type { TicketWithMoreInfo } from "$lib/server/shop/getTickets";

	export let ticket: TicketWithMoreInfo;
	let isSubmitting = false;
</script>

<form
	method="POST"
	action="?/addToCart"
	use:enhance={() => {
		isSubmitting = true;
		return ({ update }) => {
			update();
			isSubmitting = false;
		};
	}}
	class="card-actions justify-end"
>
	<input type="hidden" name="ticketId" value={ticket.id} />
	<BuyButton {ticket} {isSubmitting} />
</form>
