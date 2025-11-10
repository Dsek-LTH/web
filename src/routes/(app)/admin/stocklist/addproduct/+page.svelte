<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import { DrinkQuantityType, DrinkGroup } from "@prisma/client";
  import { superForm } from "$lib/utils/client/superForms";
  import type { PageData } from "./$types";
  import Labeled from "$lib/components/Labeled.svelte";

  const drinkGroup = Object.values(DrinkGroup);

  export let data: PageData;

  const { form, enhance } = superForm(data.form, {
    resetForm: true,
  });
</script>

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
    <a href="/admin/stocklist/spiritweights" style="margin-right:15px">
      <button class="btn btn-secondary"> Spritvikter </button>
    </a>
  </ul>
</div>

<div class="mg mt-4">
  <select class="select select-bordered w-52" bind:value={$form.quantityType}>
    <option value={DrinkQuantityType.NONE} disabled selected
      >Välj kategori</option
    >
    <option value={DrinkQuantityType.COUNTS}>Öl/Cider/Vin/Annat</option>
    <option value={DrinkQuantityType.WEIGHT}>Sprit</option>
  </select>
</div>
{#if $form.quantityType != DrinkQuantityType.NONE}
  <div class=" mt-10 w-6/12 rounded-lg border-2 border-primary p-4">
    <h2 class="font-bold">
      {$form.quantityType == DrinkQuantityType.COUNTS
        ? "Öl/Cider/Vin/Annat"
        : "Sprit"}
    </h2>
    <form
      class="flex flex-col"
      method="POST"
      name="addDrinkItem"
      action="?/createDrinkItem"
      use:enhance
    >
      <Input
        type="hidden"
        name="quantityType"
        bind:value={$form.quantityType}
      />
      <Input
        label="Namn"
        type="text"
        name="name"
        class="input bg-base-300"
        bind:value={$form.name}
      />
      <Input
        label="Systembolagets ID"
        type="number"
        name="systembolagetID"
        class="input bg-base-300"
        bind:value={$form.systembolagetID}
      />
      <Labeled label="Grupp" />
      <select class="input bg-base-300" bind:value={$form.group}>
        {#each drinkGroup as dg}
          <option>{dg}</option>
        {/each}
      </select>
      <Input
        label="Pris"
        type="number"
        name="price"
        step="0.1"
        class="input bg-base-300"
        bind:value={$form.price}
      />
      {#if $form.quantityType == DrinkQuantityType.WEIGHT}
        <Input
          label="Total vikt (gram)"
          type="number"
          name="weight"
          class="input bg-base-300"
          value={$form.weight || ""}
          placeholder="t.ex. 750"
        />
        <Input
          label="Tom flaskvikt (gram) - valfritt"
          type="number"
          name="emptyWeight"
          class="input bg-base-300"
          value={$form.emptyWeight || ""}
          placeholder="t.ex. 200 (kan uppdateras senare)"
        />
        <div class="mt-2 rounded bg-base-200 p-2 text-sm text-gray-600">
          <strong>Tips:</strong> Du kan lägga till tom flaskvikt nu eller senare
          i Spritvikter-sektionen. Spritvikt beräknas som: Total vikt - Tom flaskvikt
        </div>
      {/if}
      <div class="flex justify-end">
        <button type="submit" class=" btn btn-primary mt-2 w-4/12">Add</button>
      </div>
    </form>
  </div>
{/if}
