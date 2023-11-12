<script lang="ts">
  import Product from "./Product.svelte";
  export let form;
  export let data;
  let activeCategory = data.productCategories[0];
  $: products = data.products.filter((product) => product.categoryId === activeCategory?.id);
  $: if (form?.error) {
    console.log(form.error);
    window.alert(form.error);
  }
</script>

<div class="flex flex-col gap-3">
  {#if data.myInventory}
    <a href="/webshop/inventory" class="link-hover link-primary link"
      >Kista ({data.myInventory.userInventoryItems.length})</a
    >
  {/if}
  {#if data.myCart}
    <a href="/webshop/cart" class="link-hover link-primary link"
      >Kundvagn ({data.myCart.totalQuantity})</a
    >
  {/if}

  <h1 class="text-3xl font-bold">Webshop</h1>
  <section class="flex gap-2">
    {#each data.productCategories as category}
      <button
        type="submit"
        on:click={() => {
          activeCategory = category;
        }}
        class={`btn ${activeCategory?.id === category.id && "btn-primary"}`}>{category.name}</button
      >
    {/each}
  </section>

  <section
    class="grid gap-2"
    style="grid-template-columns: repeat(auto-fill, minmax(min(40ch, 100%), 1fr))"
  >
    {#each products as product (product.id)}
      <Product {product} cart={data.myCart} chest={data.myInventory} />
    {/each}
  </section>
</div>
