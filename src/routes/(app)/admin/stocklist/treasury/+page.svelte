<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import Navbuttons from "../navbuttons.svelte";
  import type { PageData } from "./$types";
  import type { DrinkItemBatch } from "@prisma/client";
  import Input from "$lib/components/Input.svelte";
  export let data: PageData;

  const { form: deleteForm, enhance: deleteFormEnhance } = superForm(
    data.deleteForm,
  );
  const {
    form: updateForm,
    enhance: updateFormEnhance,
    reset: updateFormReset,
  } = superForm(data.updateForm);

  const { form: dateForm } = superForm(data.dateForm);
  let dateFormElement: HTMLFormElement;

  let editId = "";

  function enableEdit(drinkBatch: DrinkItemBatch) {
    editId = drinkBatch.id;
    $updateForm.quantityDelta = drinkBatch.quantityDelta;
    $updateForm.nrBottlesDelta = drinkBatch.nrBottlesDelta
      ? drinkBatch.nrBottlesDelta
      : 0;
    $updateForm.id = drinkBatch.id;
  }

  function disableEdit() {
    editId = "";
    updateFormReset();
  }

  function doneEdit() {
    editId = "";
  }
</script>

<div
  style="display: flex; justify-content: space-between; align-items: center;"
>
  <Navbuttons currentPage="treasury"></Navbuttons>
  <!-- <h1 style="font-size: large;">Totalt lagervärde:</h1>
   Kanske LÄGGA TILL DENNA FUNKTION IGEN-->
</div>
<div class="mg mt-4">
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
      on:input={() => dateFormElement.submit()}
    />
  </form>
</div>
<div>
  <form
    method="POST"
    style="display: contents;"
    use:deleteFormEnhance
    id="deleteForm"
    action="?/deleteEntry"
  ></form>
  <form
    method="POST"
    style="display: contents;"
    use:updateFormEnhance
    id="updateForm"
    action="?/updateEntry"
    on:submit={() => doneEdit()}
  ></form>
  <table class="table">
    <thead>
      <tr>
        <th>Datum</th>
        <th>Namn</th>
        <th>Antal/Vikt</th>
        <th>Antal flaskor</th>
        <th>Användare</th>
        <th>Ändra</th>
        <th>Ta bort</th>
      </tr>
    </thead>
    <tbody>
      {#each data.entriesOnDate as entry}
        {#if editId === entry.id}
          <tr>
            <td>{new Date(entry.date).toLocaleDateString("sv-SE")}</td>
            <td>{entry.item.name}</td>
            <td>
              <Input
                type="number"
                name="quantityDelta"
                class="input w-20 bg-base-300"
                form="updateForm"
                bind:value={$updateForm.quantityDelta}
              />
              <Input
                type="hidden"
                name="id"
                form="updateForm"
                bind:value={$updateForm.id}
              />
            </td>
            {#if entry.item.quantityType === "WEIGHT"}
              <td>
                <Input
                  type="number"
                  name="nrBottlesDelta"
                  class="input w-20 bg-base-300"
                  form="updateForm"
                  bind:value={$updateForm.nrBottlesDelta}
                />
              </td>
            {:else}
              <td>-</td>
            {/if}
            <td>{entry.user}</td>
            <td>
              <button
                class="btn btn-secondary btn-sm text-white"
                aria-label="doneButton"
                type="submit"
                form="updateForm"
              >
                <span class="i-mdi-done"></span>
              </button>
            </td>
            <td>
              <button
                class="btn btn-error btn-sm text-white"
                aria-label="cancelButton"
                on:click={() => disableEdit()}
              >
                <span class="i-mdi-cancel"></span>
              </button></td
            >
          </tr>
        {:else}
          <tr>
            <td>{new Date(entry.date).toLocaleDateString("sv-SE")}</td>
            <td>{entry.item.name}</td>
            <td>{entry.quantityDelta}</td>
            <td>{entry.nrBottlesDelta ? entry.nrBottlesDelta : "-"}</td>
            <td>{entry.user}</td>
            <td>
              <button
                class="btn btn-secondary btn-sm text-white"
                aria-label="updateButton"
                on:click={() => {
                  enableEdit(entry);
                }}
              >
                <span class="i-mdi-edit"></span>
              </button>
            </td>
            <td style="padding-left: 1.5%;">
              <input
                type="hidden"
                name="id"
                bind:value={$deleteForm.id}
                form="deleteForm"
              />
              <button
                class="btn btn-error btn-sm text-white"
                aria-label="deleteButton"
                type="submit"
                form="deleteForm"
                on:click={() => {
                  $deleteForm.id = entry.id;
                }}
              >
                <span class="i-mdi-delete"></span>
              </button>
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>
