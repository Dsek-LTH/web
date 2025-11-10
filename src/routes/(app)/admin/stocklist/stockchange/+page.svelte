<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import type { PageData } from "./$types";
  import { DrinkQuantityType } from "@prisma/client";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import Price from "$lib/components/Price.svelte";
  import { id_ID } from "@faker-js/faker";

  export let data: PageData;

  const { form, enhance } = superForm(data.form);

  // Get the selected drink item to determine if it's a spirit
  $: selectedDrink = data.drinks.find(
    (drink) => drink.id === $form.drinkItemId,
  );
  $: isSpirit =
    selectedDrink &&
    selectedDrink.weight !== null &&
    selectedDrink.weight !== undefined;

  function calculateSpiritQuantity(totalWeight: number, emptyWeight: number) {
    return totalWeight - emptyWeight;
  }

  // Handle weight input change for spirits
  function handleWeightChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const weight = parseFloat(target.value) || 0;
    $form.weight = weight;

    if (isSpirit && selectedDrink?.emptyWeight && weight > 0) {
      $form.quantity = weight - selectedDrink.emptyWeight;
    }
  }

  // Handle quantity input change for regular items
  function handleQuantityChange(event: Event) {
    const target = event.target as HTMLInputElement;
    $form.quantity = parseFloat(target.value) || 0;
  }
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
  <select class="select select-bordered w-52" bind:value={$form.inOut}>
    <option value="" disabled selected>Välj kategori</option>
    <option value="IN">Skriv in</option>
    <option value="OUT">Skriv ut</option>
  </select>
</div>

{#if $form.inOut != ""}
  <div class=" mt-10 w-6/12 rounded-lg border-2 border-primary p-4">
    <h2 class="font-bold">
      {$form.inOut == "IN" ? "Skriv in" : "Skriv ut"}
    </h2>
    <form
      class="flex flex-col"
      method="POST"
      name="addDrinkItemBatch"
      action="?/createDrinkItemBatch"
      use:enhance
    >
      <Labeled label="Produkt" />
      <select
        class="input bg-base-300"
        name="drinkItemId"
        bind:value={$form.drinkItemId}
      >
        <option value="">Välj produkt</option>
        {#each data.drinks as drink}
          <option value={drink.id}>
            {drink.name} ({drink.price / 100} kr)
            {#if drink.weight}
              - Sprit (vikt: {drink.weight}g, tom flaska: {drink.emptyWeight ||
                0}g)
            {/if}
          </option>
        {/each}
      </select>

      <Input type="hidden" name="inOut" bind:value={$form.inOut} />

      {#if isSpirit}
        <div>
          <label class="label" for="weight-input"
            >Vikt (g) - Total vikt av flaskan</label
          >
          <input
            id="weight-input"
            name="weight"
            type="number"
            class="input input-bordered bg-base-300"
            placeholder="T.ex. 550g för en 750ml flaska"
            value={$form.weight || ""}
            on:input={handleWeightChange}
          />
        </div>
        {#if $form.weight && selectedDrink?.emptyWeight}
          <div class="mt-2 text-sm text-green-600">
            Beräknad spritvolym: {calculateSpiritQuantity(
              $form.weight,
              selectedDrink.emptyWeight,
            )}g
          </div>
        {/if}
        <input type="hidden" name="quantity" value={$form.quantity || 0} />
      {:else}
        <div>
          <label class="label" for="quantity-input">Antal</label>
          <input
            id="quantity-input"
            name="quantity"
            type="number"
            class="input input-bordered bg-base-300"
            value={$form.quantity || ""}
            on:input={handleQuantityChange}
          />
        </div>
        <input type="hidden" name="weight" value={$form.weight || 0} />
      {/if}
      <div class="flex justify-end">
        <button type="submit" class=" btn btn-primary mt-2 w-4/12">Add</button>
      </div>
    </form>
  </div>
{/if}
