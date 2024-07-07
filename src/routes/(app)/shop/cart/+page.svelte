<script lang="ts">
  import FoodPreferenceModal from "$lib/components/FoodPreferenceModal.svelte";
  import Cart from "./Cart.svelte";
  import Reservations from "./Reservations.svelte";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";

  export let data;
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
