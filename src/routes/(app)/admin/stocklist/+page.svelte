<script lang="ts">
  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import { DrinkQuantityType } from "@prisma/client";
  export let data: PageData;
</script>

<SetPageTitle title="Stocklist" />
<SEO
  data={{
    type: "website",
    props: {
      title: "Stocklist",
    },
  }}
/>

<div
  style="display: flex; justify-content: space-between; align-items: center;"
>
  <div>
    <ul style="list-style: none;">
      <a href="/admin/stocklist" style="margin-right:15px">
        <button class="btn btn-primary"> Överblick </button>
      </a>
      <a href="/admin/stocklist/addproduct" style="margin-right:15px">
        <button class="btn btn-primary"> Lägg till produkt </button>
      </a>
      <a href="/admin/stocklist/stockchange" style="margin-right:15px">
        <button class=" btn btn-primary"> Skriv in/ut </button>
      </a>
      <a href="/admin/stocklist/treasury" style="margin-right:15px">
        <button class=" btn btn-primary"> Action Logs </button>
      </a>
      <a href="/admin/stocklist/showproducts" style="margin-right:15px">
        <button class=" btn btn-primary"> Show Products </button>
      </a>
    </ul>
  </div>
  <h1 style="font-size: large;">
    Totalt lagervärde: {data.totalInventoryValue / 100} kr
  </h1>
</div>
<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr>
        <th>Id </th>
        <th>Namn</th>
        <th>Pris</th>
        <th>Antal/Vikt</th>
        <th>Group</th>
      </tr>
    </thead>
    <tbody>
      {#each data.grouped as item}
        {#if item.item.quantityType === DrinkQuantityType.COUNTS}
          <tr>
            <th>{item.item.systembolagetID}</th>
            <td>{item.item.name}</td>
            <td>{item.item.price / 100} kr</td>
            <td>{(item.quantityIn ?? 0) - (item.quantityOut ?? 0)}</td>
            <td>{item.item.group}</td>
          </tr>
        {:else}
          <tr>
            <th>{item.item.systembolagetID}</th>
            <td>{item.item.name}</td>
            <td>{item.item.price / 100} kr</td>
            <td>{(item.quantityIn ?? 0) - (item.quantityOut ?? 0)} g</td>
            <td>{item.item.group}</td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>
