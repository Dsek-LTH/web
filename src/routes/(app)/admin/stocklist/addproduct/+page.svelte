<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import { DrinkQuantityType, DrinkGroup } from "@prisma/client";
  import { superForm } from "$lib/utils/client/superForms";
  import type { PageData } from "./$types";
  import Labeled from "$lib/components/Labeled.svelte";

  const drinkGroup = Object.values(DrinkGroup);
  let selected: DrinkQuantityType | "" = "";

  export let data: PageData;

  const { form, enhance } = superForm(data.form);
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
  </ul>
</div>

<div class="mg mt-4">
  <select
    class="select select-bordered w-52"
    bind:value={selected}
    on:change={() => {
      if (
        selected === DrinkQuantityType.COUNTS ||
        selected === DrinkQuantityType.WEIGHT
      ) {
        $form.quantityType = selected;
      }
    }}
  >
    <option value="" disabled selected>Välj kategori</option>
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
      <div class="flex justify-end">
        <button type="submit" class=" btn btn-primary mt-2 w-4/12">Add</button>
      </div>
    </form>
  </div>
{/if}
