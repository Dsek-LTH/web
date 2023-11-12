<script lang="ts">
  import { enhance } from "$app/forms";
  import type { Cart, CartItem, ProductInventory } from "@prisma/client";
  export let cart: Cart & {
    items: (CartItem & {
      productInventory: ProductInventory & {
        product: { name: string; price: number; imageUrl: string };
      };
    })[];
  };
</script>

<h1 class="text-3xl font-bold">Kundvagn</h1>

<div class="flex flex-row justify-between">
  <p style="width: 6rem;">Sak</p>
  <p style="width: 6rem;">Pris</p>
  <p style="width: 6rem;">Antal</p>
</div>

{#each cart.items as item}
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">
        {item.productInventory.product.name}
        {item.productInventory.variant ? `( ${item.productInventory.variant} )` : ""}
      </h2>
      <div class="flex flex-row justify-between">
        <div class="avatar">
          <div class="w-24 rounded-full">
            <img
              src={item.productInventory.product.imageUrl}
              alt={item.productInventory.product.name}
            />
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold">
            {item.productInventory.product.price * item.quantity} kr (á {item.productInventory
              .product.price} kr)
          </p>
        </div>
        <div class="flex items-center gap-2">
          <form use:enhance method="POST" action="?/removeFromCart">
            <input type="hidden" name="productInventoryId" value={item.productInventory.id} />
            <button type="submit" class="btn btn-circle btn-primary btn-sm font-bold">-</button>
          </form>
          <p class="font-bold">
            {item.quantity}
          </p>
          <form use:enhance method="POST" action="?/addToCart">
            <input type="hidden" name="productInventoryId" value={item.productInventory.id} />
            <button type="submit" class="btn btn-circle btn-primary btn-sm font-bold">+</button>
          </form>
        </div>
      </div>
    </div>
  </div>
{/each}
