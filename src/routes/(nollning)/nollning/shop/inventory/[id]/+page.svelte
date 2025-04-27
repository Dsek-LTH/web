<script lang="ts">
  import InventoryItemPage from "$lib/components/shop/inventory/InventoryItemPage.svelte";

  let { data } = $props();
</script>

<InventoryItemPage {data} />
