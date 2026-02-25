<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import type { PageData } from "./$types";
  import Labeled from "$lib/components/Labeled.svelte";
  import Navbuttons from "../navbuttons.svelte";

  const drinkGroup = ["S1", "S2", "S3", "S4"];

  export let data: PageData;

  const { form, enhance, reset } = superForm(data.form, {
    resetForm: true,
  });
</script>

<Navbuttons currentPage="addproduct"></Navbuttons>

<div class="tabs-boxed tabs mt-4 w-6/12" role="tablist">
  <input
    type="radio"
    name="selectType"
    role="tab"
    class="tab text-base"
    aria-label="Öl/Cider/Vin"
    checked
    on:click={() => {
      reset();
      $form.quantityType = "COUNTS";
    }}
  />
  <div role="tabpanel" class="tab-content border-base-300 bg-base-100 p-6">
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
      <input
        type="hidden"
        name="quantityType"
        bind:value={$form.quantityType}
      />
      <Input
        label="Systembolagets ID"
        type="number"
        name="systembolagetID"
        class="input bg-base-300"
        bind:value={$form.systembolagetID}
      />
      <Labeled label="Grupp" />
      <select class="input bg-base-300" name="group" bind:value={$form.group}>
        {#each drinkGroup as dg}
          <option value={dg}>{dg}</option>
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

  <input
    type="radio"
    name="selectType"
    role="tab"
    class="tab text-base"
    aria-label="Sprit"
    on:click={() => {
      reset();
      $form.quantityType = "WEIGHT";
    }}
  />
  <div role="tabpanel" class="tab-content border-base-300 bg-base-100 p-6">
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
      <select class="input bg-base-300" name="group" bind:value={$form.group}>
        {#each drinkGroup as dg}
          <option value={dg}>{dg}</option>
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
      <Input
        label="Flaska tomvikt (g)"
        type="number"
        name="bottleEmptyWeight"
        class="input bg-base-300"
        bind:value={$form.bottleEmptyWeight}
      />
      <Input
        label="Flaska fullvikt (g)"
        type="number"
        name="bottleFullWeight"
        class="input bg-base-300"
        bind:value={$form.bottleFullWeight}
      />
      <div class="flex justify-end">
        <button type="submit" class=" btn btn-primary mt-2 w-4/12">Add</button>
      </div>
    </form>
  </div>
</div>
