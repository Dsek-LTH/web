<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { DrinkQuantityType, type Prisma } from "@prisma/client";
  import dayjs from "dayjs";
  import { isEmptyObject } from "@tiptap/core";

  const { data } = $props();

  const { enhance: deleteFormEnhance, form: deleteForm } = superForm(
    data.deleteForm,
  );
  const { form: dateForm } = superForm(data.dateForm);

  let dateFormElement: HTMLFormElement;
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
        <button class=" btn btn-primary"> Tristan Tvinga Mig </button>
      </a>
    </ul>
  </div>
  <form
    action="?/redirectDate"
    id="dateForm"
    method="POST"
    bind:this={dateFormElement}
  >
    <input
      type="date"
      class="input-border input border-primary"
      name="date"
      bind:value={$dateForm.date}
      oninput={() => dateFormElement.submit()}
    />
  </form>
  <h1 style="font-size: large;">
    Totalt lagervärde: {data.totalInventoryValue} kr
  </h1>
</div>
<div
  class="overflow-x-auto"
  style="display: flex; justify-content: space-between; align-items: center;"
>
  <table class="table">
    <thead>
      <tr>
        <th>Datum </th>
        <th>Namn</th>
        <th>Anta/Vikt In</th>
        <th>Antal/Vikt Ut</th>
        <th>Användare</th>
        <th>Ändra</th>
        <th style="padding-left: 0%;">Ta bort</th>
      </tr>
    </thead>
    <tbody>
      {#each data.entriesOnDate as entry}
        <tr>
          <td>{entry.date.toDateString()}</td>
          <td>{entry.item.name}</td>
          <td>{entry.quantityIn ?? 0}</td>
          <td>{entry.quantityOut ?? 0}</td>
          <td>{entry.user}</td>
          <td style="padding-right: 0%;">
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <form method="POST" id="updateForm">
              <button class="btn btn-primary">
                <span class="i-mdi-create"> </span>
              </button>
            </form>
          </td>
          <td style="padding-left: 0%;">
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <form
              method="POST"
              id="deleteForm"
              action="?/deleteEntry"
              use:deleteFormEnhance
            >
              <input hidden name="id" type="text" value={entry.id} />
              <button
                class="btn"
                type="submit"
                style="background-color: #CF1717;"
              >
                <span class="i-mdi-trash-can"> </span>
              </button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
