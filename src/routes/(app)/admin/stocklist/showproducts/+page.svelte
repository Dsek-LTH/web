<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import Navbuttons from "../navbuttons.svelte";
  import type { PageData } from "./$types";
  import Input from "$lib/components/Input.svelte";
  import type { DrinkItem } from "@prisma/client";
  export let data: PageData;
  const { form: deleteForm, enhance: deleteFormEnhance } = superForm(
    data.deleteForm,
  );
  const {
    form: updateForm,
    enhance: updateFormEnhance,
    reset: updateFormReset,
  } = superForm(data.updateForm);
  const drinkGroup = ["S1", "S2", "S3", "S4"];

  let editId: string = "";

  function enableEdit(item: DrinkItem) {
    editId = item.id;
    $updateForm.name = item.name;
    $updateForm.id = item.id;
    $updateForm.bottleEmptyWeight = item.bottleEmptyWeight
      ? item.bottleEmptyWeight
      : 0;
    $updateForm.bottleFullWeight = item.bottleFullWeight
      ? item.bottleFullWeight
      : 0;

    $updateForm.group = item.group;
    $updateForm.price = item.price / 100;
    $updateForm.systembolagetID = item.systembolagetID;
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
  <Navbuttons currentPage="showproducts"></Navbuttons>
</div>
<div class="mg mt-4">
  <a href="/admin/stocklist/addproduct" style="margin-right:15px">
    <button class="btn btn-primary"> Lägg till ny produkt </button>
  </a>
</div>
<div class="mt-2 overflow-x-auto">
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
        <th>Id </th>
        <th>Namn</th>
        <th>Inköpspris</th>
        <th>Grupp</th>
        <th>Vikt Tom</th>
        <th>Vikt Full</th>
        <th>Ändra</th>
        <th>Ta bort</th>
      </tr>
    </thead>
    <tbody>
      {#each data.drinkItems as item}
        {#if editId === item.id}
          <tr>
            <td>
              <Input
                type="number"
                name="systembolagetID"
                class="input w-28 bg-base-300"
                form="updateForm"
                bind:value={$updateForm.systembolagetID}
              />
              <Input
                type="hidden"
                name="id"
                bind:value={$updateForm.id}
                form="updateForm"
              />
            </td>
            <td>
              <Input
                type="string"
                name="name"
                class="input w-52 bg-base-300"
                form="updateForm"
                bind:value={$updateForm.name}
              />
            </td>
            <td>
              <Input
                type="number"
                name="price"
                class="input w-36 bg-base-300"
                form="updateForm"
                bind:value={$updateForm.price}
              />
            </td>
            <td>
              <select
                class="input bg-base-300"
                name="group"
                form="updateForm"
                bind:value={$updateForm.group}
              >
                {#each drinkGroup as dg}
                  <option value={dg}>{dg}</option>
                {/each}
              </select>
            </td>
            <td>
              <Input
                type="number"
                name="bottleEmptyWeight"
                class="input w-36 bg-base-300"
                form="updateForm"
                bind:value={$updateForm.bottleEmptyWeight}
              />
            </td>
            <td>
              <Input
                type="number"
                name="bottleFullWeight"
                class="input w-36 bg-base-300"
                form="updateForm"
                bind:value={$updateForm.bottleFullWeight}
              />
            </td>
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
            <th>{item.systembolagetID}</th>
            <td>{item.name}</td>
            <td>{item.price / 100} kr</td>
            <td>{item.group}</td>
            <td>{item.bottleEmptyWeight ? item.bottleEmptyWeight : "-"}</td>
            <td>{item.bottleFullWeight ? item.bottleFullWeight : "-"}</td>
            <td>
              <button
                class="btn btn-secondary btn-sm text-white"
                aria-label="updateButton"
                on:click={() => {
                  enableEdit(item);
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
                  $deleteForm.id = item.id;
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
