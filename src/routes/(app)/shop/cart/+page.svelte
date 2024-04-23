<script lang="ts">
  import Cart from "./Cart.svelte";
  import Reservations from "./Reservations.svelte";

  export let data;
</script>

<svelte:head>
  <title>Kundvagn | D-sektionen</title>
</svelte:head>

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
    <p class="text-2xl">Din kundvagn är tom.</p>
  {/if}
</article>
