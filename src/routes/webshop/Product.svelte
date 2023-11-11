<script lang="ts">
  import { enhance } from "$app/forms";
  import type { Product } from "@prisma/client";
  export let product: Product;
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
    <p>{product.description}</p>
    <div class="card-actions justify-end">
      {#each product.productInventories as inventory}
        <form use:enhance method="POST" action="?/addToCart">
          <input type="hidden" name="productInventoryId" value={inventory.id} />
          <button class="btn btn-primary">Buy Now</button>
        </form>
      {/each}
    </div>
  </div>
</div>
