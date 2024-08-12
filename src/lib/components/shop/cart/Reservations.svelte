<script lang="ts">
  import { invalidate } from "$app/navigation";
  import type { CartReservation as CartReservationType } from "$lib/utils/shop/types";
  import { now } from "$lib/stores/date";
  import * as m from "$paraglide/messages";
  import CartReservation from "./Reservation/CartReservation.svelte";

  export let reservations: CartReservationType[];
  let lastUpdate = new Date();

  $: if ($now.valueOf() - lastUpdate.valueOf() > 1000 * 10) {
    // refresh every 10 seconds
    lastUpdate = new Date();
    invalidate("cart");
  }
</script>

<h1 class="mb-4 text-2xl">{m.cart_reservations()}</h1>
<ul class="flex flex-col gap-4">
  {#each reservations as reservation (reservation.id)}
    <CartReservation item={reservation} />
  {/each}
</ul>
