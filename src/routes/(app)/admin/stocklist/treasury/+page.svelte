<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { invalidateAll } from "$app/navigation";
  import { DrinkQuantityType, type Prisma } from "@prisma/client";
  import dayjs from "dayjs";
  import { isEmptyObject } from "@tiptap/core";
  const { data } = $props();
  const { enhance: deleteFormEnhance, form: deleteForm } = superForm(
    data.deleteForm,
  );
  const { enhance: updateFormEnhance, form: updateForm } = superForm(
    data.updateForm,
  );

  const { form: dateForm } = superForm(data.dateForm);
  let dateFormElement: HTMLFormElement;

  let editingId = $state(null);

  $effect(() => {
    editingId = null;
    console.log(data);
  });

  function toggleEdit(id) {
    if (editingId === id) {
      editingId = null;
    } else {
      editingId = id;
    }
  }
</script>

<div
  style="display: flex; justify-content: space-between; align-items: center;"
>
  <div>
    <ul style="list-style: none;">
      <a href="/admin/stocklist" style="margin-right:10px">
        <button class="btn btn-primary"> Överblick </button>
      </a>
      <a href="/admin/stocklist/addproduct" style="margin-right:10px">
        <button class="btn btn-primary"> Lägg till produkt </button>
      </a>
      <a href="/admin/stocklist/stockchange" style="margin-right:10px">
        <button class=" btn btn-primary"> Skriv in/ut </button>
      </a>
      <a href="/admin/stocklist/treasury" style="margin-right:10px">
        <button class=" btn btn-primary"> Action Logs </button>
      </a>
      <a href="/admin/stocklist/showproducts" style="margin-right:5px">
        <button class=" btn btn-primary"> Show Products </button>
      </a>
    </ul>

    <form
      action="?/redirectDate"
      id="dateForm"
      method="POST"
      bind:this={dateFormElement}
    >
      <input
        type="date"
        style="margin-top:10px"
        class="input-border input border-primary"
        name="date"
        bind:value={$dateForm.date}
        oninput={() => dateFormElement.submit()}
      />
    </form>
  </div>
  <h1 style="font-size: large;">
    Totalt lagervärde: {(
      Math.floor(data.totalInventoryValue * 100) / 100
    ).toFixed(2)} kr
  </h1>
</div>
<div
  class="overflow-x-auto"
  style="display: flex; justify-content: space-between; align-items: center;"
>
  <table class="table">
    <thead>
      <tr>
        <th>Datum</th>
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
        {@const formId = `form-${entry.id}`}

        {#if editingId === entry.id}
          <tr class="bg-base-200">
            <td>
              <form
                method="POST"
                action="?/updateEntry"
                id={formId}
                style="display:none"
                use:updateFormEnhance={{
                  onResult: ({ result }) => {
                    invalidateAll();
                  },
                }}
              >
                <input type="hidden" name="id" value={entry.id} />
              </form>
              <input
                type="text"
                name="date"
                form={formId}
                value={new Date(entry.date).toLocaleDateString("sv-SE")}
                class="input input-sm input-bordered w-full"
              />
            </td>

            <td>
              <select
                class="input bg-base-300"
                name="drinkItemId"
                id="drinkItemId"
                form={formId}
                value={entry.drinkItemId}
              >
                <option disabled selected value>Välj produkt</option>
                {#each data.drinks as drink}
                  <option value={drink.id}>
                    {drink.name} ({drink.price / 100} kr)
                  </option>
                {/each}
              </select>
            </td>

            <td>
              <input
                type="number"
                name="quantityIn"
                form={formId}
                value={entry.quantityIn ?? 0}
                class="input input-sm input-bordered w-20"
              />
            </td>

            <td>
              <input
                type="number"
                name="quantityOut"
                form={formId}
                value={entry.quantityOut ?? 0}
                class="input input-sm input-bordered w-20"
              />
            </td>

            <td class="cursor-default opacity-50">
              {entry.user}
            </td>

            <td>
              <button
                class="btn btn-success btn-sm text-white"
                type="submit"
                form={formId}
                onclick={() => invalidateAll()}
              >
                <span class="i-mdi-check"></span>
              </button>
            </td>

            <td style="padding-left: 0%;">
              <button
                class="btn btn-ghost btn-sm"
                onclick={() => toggleEdit(entry.id)}
              >
                ✕
              </button>
            </td>
          </tr>
        {:else}
          <tr>
            <td>{new Date(entry.date).toLocaleDateString("sv-SE")}</td>

            <td>{entry.item.name}</td>

            <td>{entry.quantityIn ?? 0}</td>

            <td>{entry.quantityOut ?? 0}</td>

            <td>{entry.user}</td>

            <td>
              <button
                class="btn btn-primary btn-sm"
                onclick={() => toggleEdit(entry.id)}
              >
                <span class="i-mdi-create"></span>
              </button>
            </td>

            <td style="padding-left: 0%;">
              <form
                method="POST"
                id="deleteForm"
                action="?/deleteEntry"
                use:deleteFormEnhance
              >
                <input type="hidden" name="id" value={entry.id} />
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
