<script lang="ts">
  import * as m from "$paraglide/messages";

  export let data;
</script>

<svelte:head>
  <title>{m.cart_paymentStatus_pageTitle()} | D-sektionen</title>
</svelte:head>

<h1 class="text-2xl font-bold">{data.message}</h1>
