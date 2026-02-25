<script lang="ts">
	import type { CartReservation as CartReservationType } from "$lib/utils/shop/types";
	import * as m from "$paraglide/messages";
	import CartReservation from "./Reservation/CartReservation.svelte";

	export let reservations: CartReservationType[];
</script>

<h1 class="mb-4 text-2xl">{m.cart_reservations()}</h1>
<ul class="flex flex-col gap-4">
	{#each reservations as reservation (reservation.id)}
		<CartReservation item={reservation} />
	{/each}
</ul>
