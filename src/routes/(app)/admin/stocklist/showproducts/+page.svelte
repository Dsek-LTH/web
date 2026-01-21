<script lang="ts">
  import { DrinkQuantityType } from "@prisma/client";
  import { superForm } from "sveltekit-superforms";
  import StocklistNav from "../StocklistNav.svelte";

  const { data } = $props();
  const { enhance: deleteFormEnhance, form: deleteForm } = superForm(
    data.deleteForm,
  );
</script>

<StocklistNav />
<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr>
        <th>Id </th>
        <th>Namn</th>
        <th>Pris</th>
        <th>Grupp</th>
        <th>Vikt Tom</th>
        <th>Vikt Full</th>
        <th>Ta bort</th>
      </tr>
    </thead>
    <tbody>
      {#each data.drinkItems as item}
        {#if item.quantityType === DrinkQuantityType.COUNTS}
          <tr>
            <th>{item.systembolagetID}</th>
            <td>{item.name}</td>
            <td>{item.price / 100} kr</td>
            <td>{item.group}</td>
            <td>-</td>
            <td>-</td>
            <td class="pl-0">
              <form
                method="POST"
                id="deleteForm"
                action="?/deleteEntry"
                use:deleteFormEnhance
              >
                <input type="hidden" name="id" value={item.id} />
                <button class="btn btn-error btn-sm text-white">
                  <span class="i-mdi-delete"></span>
                </button>
              </form>
            </td>
          </tr>
        {:else}
          <tr>
            <th>{item.systembolagetID}</th>
            <td>{item.name}</td>
            <td>{item.price / 100} kr</td>
            <td>{item.group}</td>
            <td>{item.bottleEmptyWeight}</td>
            <td>{item.bottleFullWeight}</td>
            <td class="pl-0">
              <form
                method="POST"
                id="deleteForm"
                action="?/deleteEntry"
                use:deleteFormEnhance
              >
                <input type="hidden" name="id" value={item.id} />
                <button class="btn btn-error btn-sm text-white">
                  <span class="i-mdi-delete"></span>
                </button>
              </form>
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>
