<script lang="ts">
  import InventoryPage from "$lib/components/shop/inventory/InventoryPage.svelte";

  let { data } = $props();
</script>

<InventoryPage {data} />
