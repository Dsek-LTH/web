<script lang="ts">
  import type { PageData } from "./$types";
  import SetPageTitle from "$lib/components/nav/SetPageTitle.svelte";
  import SEO from "$lib/seo/SEO.svelte";
  export let data: PageData;
  import Navbuttons from "./navbuttons.svelte";
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
  <div
    style="display: flex; justify-content: space-between; align-items: center;"
  >
    <Navbuttons currentPage="overview"></Navbuttons>
    <form method="POST" enctype="multipart/form-data" action="?/readFile">
      <input type="file" name="upload" class="file-input file-input-primary" />
      <button type="submit" class="btn btn-primary">Upload</button>
    </form>
  </div>
  <h1 style="font-size: large;">
    Totalt lagervärde: {data.currentInventoryValue.toFixed(0)} kr
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
            <td>Öl/Cider</td>
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
            <td
              >{(
                (item.quantityAvailable! - item.bottleEmptyWeight!) /
                (item.bottleFullWeight! - item.bottleEmptyWeight!)
              ).toFixed(2)} flaskor</td
            >
            <td>{item.group}</td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>
