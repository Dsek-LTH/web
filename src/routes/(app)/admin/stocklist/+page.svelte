<script lang="ts">
  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import { DrinkQuantityType } from "@prisma/client";
  import StocklistNav from "./StocklistNav.svelte";
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

<StocklistNav totalInventoryValue={data.totalInventoryValue} />
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
