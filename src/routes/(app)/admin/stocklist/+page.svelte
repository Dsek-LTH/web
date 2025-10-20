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
  </ul>
</div>
<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr>
        <th>Id </th>
        <th>Namn</th>
        <th>Pris</th>
        <th>Antal</th>
        <th>Group</th>
      </tr>
    </thead>
    <tbody>
      {#each data.items as item}
        <tr>
          <th>{item.item.systembolagetID}</th>
          <td>{item.item.name}</td>
          <td>{item.item.price / 100}</td>
          <td>{item.quantity}</td>
          <td>{item.item.group}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
