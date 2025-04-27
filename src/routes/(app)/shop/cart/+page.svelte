<script lang="ts">
  import CartPage from "$lib/components/shop/cart/CartPage.svelte";

  let { data } = $props();
</script>

<CartPage {data} />
