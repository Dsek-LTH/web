<script lang="ts">
  import FoodPreferenceModal from "$lib/components/FoodPreferenceModal.svelte";
  import Cart from "./Cart.svelte";
  import Reservations from "./Reservations.svelte";
  import * as m from "$paraglide/messages";

  export let data;
</script>

<svelte:head>
  <title>{m.cart()} | D-sektionen</title>
</svelte:head>

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
