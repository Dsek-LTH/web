<script lang="ts">
  import { run } from "svelte/legacy";

  import { invalidate } from "$app/navigation";
  import FoodPreferenceModal from "$lib/components/FoodPreferenceModal.svelte";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import type { CartLoadData } from "$lib/server/shop/cart/getCart";
  import { now } from "$lib/stores/date";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import Cart from "./Cart.svelte";
  import Reservations from "./Reservations.svelte";

  interface Props {
    data: CartLoadData;
  }

  let { data }: Props = $props();
  let lastUpdate = $state(Date.now());
  const superform = superForm(data.purchaseForm);
  const { message } = superform;
  let isPurchasing = $derived($message?.["clientSecret"] !== undefined);
  let questionModalOpen: boolean = $state();

  run(() => {
    if (!isPurchasing && $now.valueOf() - lastUpdate > 1000 * 10) {
      // refresh every 10 seconds, mainly used for reservations queue.
      // expiring cart item har handled in the ExpiresAtTimer component.
      // we do not want to invalidate mid purchase
      lastUpdate = Date.now();
      invalidate("cart");
    }
  });
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
        bind:questionModalOpen
      />
    {/if}

    {#if data.reservations.length > 0}
      <Reservations reservations={data.reservations} />
    {/if}
  {:else}
    <p class="text-2xl">{m.cart_empty()}</p>
  {/if}
</article>
