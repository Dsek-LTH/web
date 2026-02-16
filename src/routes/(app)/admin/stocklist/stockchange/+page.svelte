<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import type { PageData } from "./$types";
  import { type DrinkItem } from "@prisma/client";
  import Navbuttons from "../navbuttons.svelte";
  import { superForm } from "$lib/utils/client/superForms";

  export let data: PageData;

  const {
    form: inForm,
    enhance: inFormEnhance,
    reset: inFormReset,
  } = superForm(data.inForm, {
    resetForm: true,
  });
  const {
    form: outForm,
    enhance: outFormEnhance,
    reset: outFormReset,
  } = superForm(data.outForm, {
    resetForm: true,
  });

  let possibleMatches: DrinkItem[] = [];
  let search = "";
  let selectedItem: DrinkItem | undefined;

  function checkIfSame(search: string, target: string): boolean {
    target = target.toLowerCase();
    search = search.toLowerCase();

    for (let i = 0; i < search.length; i++) {
      if (search[i] !== target[i]) return false;
    }
    return true;
  }

  function findMatches() {
    if (!search) {
      possibleMatches = [];
      return;
    }
    possibleMatches = data.drinkItems.filter((item) =>
      checkIfSame(search, item.name),
    );
  }
  function selectItem(item: DrinkItem) {
    search = item.name + " (" + item.price / 100 + " kr)";
    selectedItem = item;
    possibleMatches = [];
  }
  function reset() {
    inFormReset();
    outFormReset();
    selectedItem = undefined;
    search = "";
  }
</script>

<div
  style="display: flex; justify-content: space-between; align-items: center;"
>
  <Navbuttons currentPage="stockchange"></Navbuttons>
</div>

<div class="tabs-boxed tabs mt-4 w-6/12" role="tablist">
  <input
    type="radio"
    name="selectType"
    role="tab"
    class="tab text-base"
    aria-label="Skriv in"
    checked
    on:click={() => {
      reset();
    }}
  />
  <div role="tabpanel" class="tab-content border-base-300 bg-base-100 p-6">
    <form
      class="flex flex-col"
      method="POST"
      name="createInBatch"
      action="?/createInBatch"
      use:inFormEnhance
      on:submit={() => {
        reset();
      }}
    >
      <input
        class="input mb-1 bg-base-300"
        type="string"
        placeholder="Sök efter produkt"
        bind:value={search}
        on:input={() => findMatches()}
      />
      {#if possibleMatches.length != 0}
        <div class=" p-1">
          {#each possibleMatches as item}
            <button
              class="input w-full bg-base-300 text-left"
              type="button"
              on:click={() => {
                selectItem(item);
                $inForm.drinkItemId = item.id;
              }}
            >
              {item.name} ({item.price / 100} kr)
            </button>
          {/each}
        </div>
      {/if}
      {#if selectedItem}
        <Labeled label={`Tillgängligt: ${selectedItem.quantityAvailable}`} />
        <Input
          type="hidden"
          name="drinkItemId"
          bind:value={$inForm.drinkItemId}
        />
        <Input
          type="number"
          name="quantityDelta"
          label="Antal/Vikt"
          class="input bg-base-300"
          bind:value={$inForm.quantityDelta}
        />
        {#if selectedItem.quantityType === "WEIGHT"}
          <Input
            label="Antal flaskor"
            type="number"
            name="nrBottles"
            class="input bg-base-300"
            bind:value={$inForm.nrBottles}
          />
        {/if}
        <Input
          label="Datum"
          type="date"
          name="date"
          class="input bg-base-300"
          bind:value={$inForm.date}
        />
        <div class="flex justify-end">
          <button type="submit" class=" btn btn-primary mt-2 w-4/12">Add</button
          >
        </div>
      {/if}
    </form>
  </div>

  <input
    type="radio"
    name="selectType"
    role="tab"
    class="tab text-base"
    aria-label="Skriv ut"
    on:click={() => {
      reset();
    }}
  />
  <div role="tabpanel" class="tab-content border-base-300 bg-base-100 p-6">
    <form
      class="flex flex-col"
      method="POST"
      name="createOutBatch"
      action="?/createOutBatch"
      use:outFormEnhance
      on:submit={() => reset()}
    >
      <input
        class="input mb-1 bg-base-300"
        type="string"
        placeholder="Sök efter produkt"
        bind:value={search}
        on:input={() => findMatches()}
      />
      {#if possibleMatches.length != 0}
        <div class=" p-1">
          {#each possibleMatches as item}
            <button
              class="input w-full bg-base-300 text-left"
              type="button"
              on:click={() => {
                selectItem(item);
                $outForm.drinkItemId = item.id;
              }}
            >
              {item.name} ({item.price / 100} kr)
            </button>
          {/each}
        </div>
      {/if}
      {#if selectedItem}
        <Labeled label={`Tillgängligt: ${selectedItem.quantityAvailable}`} />
        <Input
          type="hidden"
          name="drinkItemId"
          bind:value={$outForm.drinkItemId}
        />
        <Input
          type="number"
          name="quantityDelta"
          label="Antal/Vikt"
          class="input bg-base-300"
          bind:value={$outForm.quantityDelta}
        />
        {#if selectedItem.quantityType === "WEIGHT"}
          <Input
            label="Antal flaskor"
            type="number"
            name="nrBottles"
            class="input bg-base-300"
            bind:value={$outForm.nrBottles}
          />
        {/if}
        <Input
          label="Datum"
          type="date"
          name="date"
          class="input bg-base-300"
          bind:value={$outForm.date}
        />
        <div class="flex justify-end">
          <button type="submit" class=" btn btn-primary mt-2 w-4/12">Add</button
          >
        </div>
      {/if}
    </form>
  </div>
</div>
