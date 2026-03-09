<script lang="ts">
  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  export let data: PageData;
  import type { DrinkItem } from "@prisma/client";
  import Navbuttons from "./navbuttons.svelte";

  function calcBottles(item: DrinkItem) {
    if (item.bottleEmptyWeight != 0 && item.bottleFullWeight != 0) {
      return (
        (
          (item.quantityAvailable! -
            item.nrBottles! * item.bottleEmptyWeight!) /
          (item.bottleFullWeight! - item.bottleEmptyWeight!)
        ).toFixed(2) + " flaskor"
      );
    } else {
      return item.quantityAvailable + " g (flaskvikt saknas)";
    }
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
  style="display: flex; justify-content: space-between; align-items: center; "
>
  <div
    style="display: flex; justify-content: space-between; align-items: center; size: "
  >
    <Navbuttons currentPage="overview"></Navbuttons>
    <form method="POST" enctype="multipart/form-data" action="?/readFile">
      <input
        type="file"
        name="upload"
        class="file-input file-input-primary h-8 w-32"
      />
      <button type="submit" class="btn btn-primary btn-sm">Upload</button>
    </form>
  </div>
  <h1 style="font-size: large;">
    Totalt estimerat lagervärde: {data.currentInventoryValue.toFixed(0)} kr
  </h1>
</div>
<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr>
        <th>Id </th>
        <th>Namn</th>
        <th>Kategori</th>
        <th>Inköpspris</th>
        <th>Antal</th>
        <th>Group</th>
      </tr>
    </thead>
    <tbody>
      {#each data.drinkItems as item}
        {#if item.quantityType === "COUNTS"}
          <tr>
            <th>{item.systembolagetID}</th>
            <td>{item.name}</td>
            <td>{item.group === "S3" ? "Vin" : "Öl/Cider"}</td>
            <td>{item.price / 100} kr</td>
            <td>{item.quantityAvailable} st</td>
            <td>{item.group}</td>
          </tr>
        {:else}
          <tr>
            <th>{item.systembolagetID}</th>
            <td>{item.name}</td>
            <td>Sprit</td>
            <td>{item.price / 100} kr</td>
            <td> {calcBottles(item)}</td>
            <td>{item.group}</td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>
