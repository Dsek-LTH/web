<script lang="ts">
  import PurchaseSection from "./PurchaseSection.svelte";

  export let data;
</script>

<svelte:head>
  <title>Kundvagn | D-sektionen</title>
</svelte:head>

<article class="flex flex-col">
  <h1>Kundvagn</h1>
  <PurchaseSection purchaseForm={data.purchaseForm} />
</article>
