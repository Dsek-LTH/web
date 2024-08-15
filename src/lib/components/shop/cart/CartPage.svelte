<script lang="ts">
  import { invalidate } from "$app/navigation";
  import FoodPreferenceModal from "$lib/components/FoodPreferenceModal.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { CartLoadData } from "$lib/server/shop/cart/getCart";
  import { now } from "$lib/stores/date";
  import * as m from "$paraglide/messages";
  import { superForm } from "sveltekit-superforms";
  import Cart from "./Cart.svelte";
  import Reservations from "./Reservations.svelte";

  export let data: CartLoadData;
  let lastUpdate = Date.now();
  const superform = superForm(data.purchaseForm);
  const { message } = superform;
  $: isPurchasing = $message?.["clientSecret"] !== undefined;

  $: if (!isPurchasing && $now.valueOf() - lastUpdate > 1000 * 10) {
    // refresh every 10 seconds, mainly used for reservations queue.
    // expiring cart item har handled in the ExpiresAtTimer component.
    // we do not want to invalidate mid purchase
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
        {superform}
      />
    {/if}

    {#if data.reservations.length > 0}
      <Reservations reservations={data.reservations} />
    {/if}
  {:else}
    <p class="text-2xl">{m.cart_empty()}</p>
  {/if}
</article>
