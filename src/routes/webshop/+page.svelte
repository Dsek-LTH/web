<script lang="ts">
  import Product from "./Product.svelte";
  export let form;
  export let data;
  let activeCategory = data.productCategories[0];
  $: products = data.products.filter((product) => product.categoryId === activeCategory?.id);
  $: if (form?.error) {
    console.log(form.error);
  }
</script>

<div class="flex flex-col gap-3">
  <section>
    {#each data.productCategories as category}
      <button
        type="submit"
        on:click={() => {
          activeCategory = category;
        }}
        class={`btn btn-circle ${activeCategory?.id === category.id && "btn-primary"}`}
        >{category.name}</button
      >
    {/each}
  </section>

  <section
    class="grid gap-2"
    style="grid-template-columns: repeat(auto-fill, minmax(min(40ch, 100%), 1fr))"
  >
    {#each products as product}
      <Product {product} />
    {/each}
  </section>
</div>
