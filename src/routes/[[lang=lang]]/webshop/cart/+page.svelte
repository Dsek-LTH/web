<script>
  import Cart from "./Cart.svelte";
  export let data;
</script>

{#if data.myCart}
  <Cart cart={data.myCart} />
{:else}
  <p>Du har ingen kundvagn</p>
{/if}
