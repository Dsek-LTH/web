<script lang="ts">
  import { enhance } from "$app/forms";
  import { getMyQuantity } from "./utils";
  import type {
    Product,
    ProductInventory,
    Cart,
    CartItem,
    UserInventory,
    UserInventoryItem,
  } from "@prisma/client";
  export let product: Product & { productInventories: ProductInventory[] };
  export let cart: (Cart & { items: CartItem[] }) | null;
  export let chest:
    | (UserInventory & {
        userInventoryItems: UserInventoryItem[];
      })
    | null;
  let selectedInventoryIndex = 0;
  $: first = product.productInventories[0];
  $: hasNoVariants = product.productInventories.length === 1;
  $: youHaveQuantity = getMyQuantity(product, cart, chest);
</script>

<div class="card bg-base-100 shadow-xl">
  <figure>
    <img
      class="w-full"
      style="height: 194px; object-fit: cover;"
      src={product.imageUrl}
      alt={product.name}
    />
  </figure>
  <div class="card-body">
    <h2 class="card-title">{product.name}</h2>
    <div class="flex flex-row justify-between">
      <div class="badge badge-primary badge-lg font-bold">
        {#if product.price === 0}
          Gratis
        {:else}
          {product.price} kr
        {/if}
      </div>
      <div class="text-right">
        {#if hasNoVariants && first}
          <p class="font-bold">
            {#if first.quantity > 0}
              {first.quantity} kvar
            {:else}
              Slutsåld
            {/if}
          </p>
        {/if}
        {#if youHaveQuantity.total > 0}
          <p>
            Du har
            <span class="font-bold">
              {youHaveQuantity.total}
              st
            </span>
            i din varukorg({youHaveQuantity.inCart}) eller kista({youHaveQuantity.inChest})
          </p>
        {/if}
        <p>
          Man får köpa
          <span class="font-bold">
            {product.maxPerUser} st
          </span>
          per person
        </p>
      </div>
    </div>
    <p>{product.description}</p>
    <div class=" card-actions flex flex-col justify-end gap-2">
      {#if !hasNoVariants}
        <div>
          <p class="font-bold">Välj variant</p>
          <select
            id="selectedInventory"
            class="select select-bordered w-full max-w-xs"
            bind:value={selectedInventoryIndex}
            required
          >
            {#each product.productInventories as inventory, index}
              <option value={index}>{inventory.variant}</option>
            {/each}
          </select>
        </div>
      {/if}

      <form use:enhance method="POST" action="/webshop?/addToCart">
        <input
          type="hidden"
          name="productInventoryId"
          value={product.productInventories[selectedInventoryIndex]?.id}
        />
        <button class="btn btn-primary">Buy Now</button>
      </form>
    </div>
  </div>
</div>
