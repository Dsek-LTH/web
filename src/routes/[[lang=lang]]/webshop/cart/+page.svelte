<script lang="ts">
  import Cart from "./Cart.svelte";
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

{#if data.myCart}
  <Cart cart={data.myCart} />
{:else}
  <p>Du har ingen kundvagn</p>
{/if}
