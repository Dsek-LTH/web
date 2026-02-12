<script lang="ts">
  import { superForm } from "sveltekit-superforms";

  const { data } = $props();
  const { enhance: deleteFormEnhance } = superForm(data.deleteForm);
</script>

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
</div>
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
        {#if item.quantityType === "COUNTS"}
          <tr>
            <th>{item.systembolagetID}</th>
            <td>{item.name}</td>
            <td>{item.price / 100} kr</td>
            <td>{item.group}</td>
            <td>-</td>
            <td>-</td>
            <td style="padding-left: 0%;">
              <form
                method="POST"
                id="deleteForm"
                action="?/deleteEntry"
                use:deleteFormEnhance
              >
                <input type="hidden" name="id" value={item.id} />
                <button
                  class="btn btn-error btn-sm text-white"
                  aria-label="deleteButton"
                >
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
            <td style="padding-left: 0%;">
              <form
                method="POST"
                id="deleteForm"
                action="?/deleteEntry"
                use:deleteFormEnhance
              >
                <input type="hidden" name="id" value={item.id} />
                <button
                  class="btn btn-error btn-sm text-white"
                  aria-label="deleteButton"
                >
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
