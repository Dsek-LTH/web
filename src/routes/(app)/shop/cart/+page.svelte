<script lang="ts">
  import Cart from "./Cart.svelte";

  export let data;
</script>

<svelte:head>
  <title>Kundvagn | D-sektionen</title>
</svelte:head>

<article class="flex flex-col">
  <h1 class="text-2xl">Kundvagn</h1>

  {#if data.inCart.length > 0}
    <Cart
      inCart={data.inCart}
      transactionFee={data.transactionFee}
      totalPrice={data.totalPrice}
      purchaseForm={data.purchaseForm}
    />
  {:else}
    <p>Din kundvagn är tom.</p>
  {/if}
</article>
