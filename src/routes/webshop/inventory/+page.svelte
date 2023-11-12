<script>
  export let data;
  console.log(data?.myInventory?.userInventoryItems);
</script>

{#if data?.myInventory?.userInventoryItems.length}
  <div class="flex flex-col gap-4">
    <h1 class="text-3xl font-bold">Kista</h1>
    {#each data.myInventory?.userInventoryItems as inventoryItem (inventoryItem.id)}
      <div class="flex items-center justify-between gap-3 rounded-xl bg-zinc-900 p-4">
        <div class="avatar">
          <div class="w-12 rounded-full">
            <img src={inventoryItem.imageUrl} alt={inventoryItem.imageUrl} />
          </div>
        </div>
        <p class="text-xl font-bold">{inventoryItem.name}</p>
        {#if !inventoryItem.consumedAt}
          <button class="btn btn-primary">Förbruka</button>
        {:else}
          <p class="text-md">
            Förbrukad {new Date(inventoryItem.consumedAt).toLocaleString("sv-SE")}
          </p>
        {/if}
      </div>
    {/each}
  </div>
{:else}
  <div class="text-xl">Du har inget i kistan.</div>
{/if}
