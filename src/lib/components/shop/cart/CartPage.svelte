<script lang="ts">
  import FoodPreferenceModal from "$lib/components/FoodPreferenceModal.svelte";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import Cart from "./Cart.svelte";
  import Reservations from "./Reservations.svelte";
  import type { CartLoadData } from "$lib/server/shop/cart/getCart";
  import { now } from "$lib/stores/date";
  import { invalidate } from "$app/navigation";

  export let data: CartLoadData;
  let lastUpdate = Date.now();

  $: if ($now.valueOf() - lastUpdate > 1000 * 5) {
    // refresh every 5 seconds
    lastUpdate = Date.now();
    invalidate("cart");
  }
</script>

<SetPageTitle title={m.cart()} />

<FoodPreferenceModal />

<article class="flex flex-col">
  {#if data.inCart.length > 0 || data.reservations.length > 0}
    {#if data.inCart.length > 0}
      <Cart
        inCart={data.inCart}
        transactionFee={data.transactionFee}
        totalPrice={data.totalPrice}
        purchaseForm={data.purchaseForm}
      />
    {/if}

    {#if data.reservations.length > 0}
      <Reservations reservations={data.reservations} />
    {/if}
  {:else}
    <p class="text-2xl">{m.cart_empty()}</p>
  {/if}
</article>
