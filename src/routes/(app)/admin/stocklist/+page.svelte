<script lang="ts">
  import { page } from "$app/stores";
  import apiNames from "$lib/utils/apiNames";
  import { isAuthorized } from "$lib/utils/authorization";
  import type { PageData } from "./$types";
  import * as m from "$paraglide/messages";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  import { colors } from "$lib/utils/themes";
  export let data: PageData;

  // Filter state
  let filter: "all" | "spirits" | "units" = "all";

  // Filtered data based on the selected filter (only show inventory items)
  $: filteredData = data.grouped.filter((item) => {
    if (filter === "spirits") {
      return item.item.weight !== null && item.item.weight !== undefined;
    } else if (filter === "units") {
      return item.item.weight === null || item.item.weight === undefined;
    }
    return true; // 'all' filter
  });

  function getSpiritWeight(item: any) {
    if (item.weight && item.emptyWeight) {
      return item.weight - item.emptyWeight;
    }
    return null;
  }
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
  <ul style="list-style: none; padding: 0; margin: 0; display: flex;">
    <a href="/admin/stocklist" style="margin-right:15px">
      <button class="btn btn-primary"> Överblick </button>
    </a>
    <a href="/admin/stocklist/addproduct" style="margin-right:15px">
      <button class="btn btn-primary"> Lägg till produkt </button>
    </a>
    <a href="/admin/stocklist/stockchange" style="margin-right:15px">
      <button class=" btn btn-primary"> Skriv in/ut </button>
    </a>
    <a href="/admin/stocklist/spiritweights" style="margin-right:15px">
      <button class="btn btn-secondary"> Spritvikter </button>
    </a>
  </ul>
  <h1 style="font-size: large;">
    Totalt lagervärde: {data.totalInventoryValue / 100} kr
  </h1>
</div>

<!-- Filter buttons -->
<div class="mb-6">
  <div class="btn-group">
    <button
      class="btn {filter === 'all' ? 'btn-active' : ''}"
      on:click={() => (filter = "all")}
    >
      Alla ({data.grouped.length})
    </button>
    <button
      class="btn {filter === 'spirits' ? 'btn-active' : ''}"
      on:click={() => (filter = "spirits")}
    >
      Sprit ({data.grouped.filter((item) => item.item.weight).length})
    </button>
    <button
      class="btn {filter === 'units' ? 'btn-active' : ''}"
      on:click={() => (filter = "units")}
    >
      Enheter ({data.grouped.filter((item) => !item.item.weight).length})
    </button>
  </div>
</div>

<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr>
        <th>Id</th>
        <th>Namn</th>
        <th>Pris</th>
        <th>Antal</th>
        <th>Grupp</th>
        {#if filter === "all" || filter === "spirits"}
          <th>Total vikt (g)</th>
          <th>Tom flaska (g)</th>
          <th>Sprit vikt (g)</th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each filteredData as item}
        <tr>
          <th>{item.item.systembolagetID}</th>
          <td>{item.item.name}</td>
          <td>{item.item.price / 100} kr</td>
          <td>{item.quantity}</td>
          <td>{item.item.group}</td>
          {#if filter === "all" || filter === "spirits"}
            <td>{item.item.weight || "-"}</td>
            <td>{item.item.emptyWeight || "-"}</td>
            <td class="font-bold text-green-600">
              {getSpiritWeight(item.item) || "-"}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
