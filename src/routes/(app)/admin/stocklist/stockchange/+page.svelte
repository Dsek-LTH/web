<script lang="ts">
  import { superForm } from "sveltekit-superforms";

  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";
  import { DrinkQuantityType, type DrinkItem } from "@prisma/client";
  import FormDateInput from "$lib/components/forms/FormDateInput.svelte";
  import dayjs from "dayjs";
  import StocklistNav from "../StocklistNav.svelte";

  const { data } = $props();
  const { form, enhance } = superForm(data.form);
  console.log($form.date);

  let selectedDrinkItem: DrinkItem | undefined = $derived(
    data.drinks.filter((drink) => drink.id === $form.drinkItemId).pop(),
  );
</script>

<StocklistNav />

<div class="mg mt-4">
  <select class="select select-bordered w-52" bind:value={$form.inOut}>
    <option value="" disabled selected>Välj kategori</option>
    <option value="IN">Skriv in</option>
    <option value="OUT">Skriv ut</option>
  </select>
</div>

{#if $form.inOut !== ""}
  {#if $form.inOut === "IN"}
    <div class=" mt-10 w-6/12 rounded-lg border-2 border-primary p-4">
      <h2 class="font-bold">Skriv in</h2>
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
          <option disabled selected value>Välj produkt</option>
          {#each data.drinks as drink}
            <option value={drink.id}>
              {drink.name} ({drink.price / 100} kr)
            </option>
          {/each}
        </select>
        <Input type="hidden" name="inOut" bind:value={$form.inOut} />

        {#if selectedDrinkItem}
          {#if selectedDrinkItem!.quantityType === DrinkQuantityType.COUNTS}
            <Labeled
              label={`Tillgängligt: ${data.entriesIn.filter((i) => i.drinkItemId === selectedDrinkItem!.id).reduce((sum, i) => sum + i.quantityIn!, 0) - data.entriesOut.filter((i) => i.drinkItemId === selectedDrinkItem!.id).reduce((sum, i) => sum + i.quantityOut!, 0)}`}
            />

            <Input type="hidden" name="inOut" bind:value={$form.inOut} />
            <Input
              label="Antal"
              type="number"
              name="quantityIn"
              class="input bg-base-300"
              bind:value={$form.quantityIn}
            />

            <Input
              label="Datum"
              type="date"
              name="date"
              class="input bg-base-300"
              bind:value={$form.date}
            />
          {:else}
            <Labeled
              label={`Tillgängligt: ${data.entriesIn.filter((i) => i.drinkItemId === selectedDrinkItem!.id).reduce((sum, i) => sum + i.quantityIn!, 0) - data.entriesOut.filter((i) => i.drinkItemId === selectedDrinkItem!.id).reduce((sum, i) => sum + i.quantityOut!, 0)}`}
            />

            <Input type="hidden" name="inOut" bind:value={$form.inOut} />
            <Input
              label="Vikt"
              type="number"
              name="quantityIn"
              class="input bg-base-300"
              bind:value={$form.quantityIn}
            />

            <Input
              label="Antal flaskor"
              type="number"
              name="nrBottles"
              class="input bg-base-300"
              bind:value={$form.nrBottles}
            />

            <Input
              label="Datum"
              type="date"
              name="date"
              class="input bg-base-300"
              bind:value={$form.date}
            />
          {/if}
        {/if}

        <div class="flex justify-end">
          <button type="submit" class=" btn btn-primary mt-2 w-4/12">Add</button
          >
        </div>
      </form>
    </div>
  {:else}
    <div class=" mt-10 w-6/12 rounded-lg border-2 border-primary p-4">
      <h2 class="font-bold">Skriv ut</h2>
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
          <option disabled selected value>Välj produkt</option>
          {#each data.drinks as drink}
            <option value={drink.id}>
              {drink.name} ({drink.price / 100} kr)
            </option>
          {/each}
        </select>
        {#if selectedDrinkItem}
          {#if selectedDrinkItem!.quantityType === DrinkQuantityType.COUNTS}
            <Labeled
              label={`Tillgängligt: ${data.entriesIn.filter((i) => i.drinkItemId === selectedDrinkItem!.id).reduce((sum, i) => sum + i.quantityIn!, 0) - data.entriesOut.filter((i) => i.drinkItemId === selectedDrinkItem!.id).reduce((sum, i) => sum + i.quantityOut!, 0)}`}
            />

            <Input type="hidden" name="inOut" bind:value={$form.inOut} />
            <Input
              label="Antal"
              type="number"
              name="quantityOut"
              class="input bg-base-300"
              bind:value={$form.quantityOut}
            />

            <Input
              label="Datum"
              type="date"
              name="date"
              class="input bg-base-300"
              bind:value={$form.date}
            />
          {:else}
            <Labeled
              label={`Tillgängligt: ${data.entriesIn.filter((i) => i.drinkItemId === selectedDrinkItem!.id).reduce((sum, i) => sum + i.quantityIn!, 0) - data.entriesOut.filter((i) => i.drinkItemId === selectedDrinkItem!.id).reduce((sum, i) => sum + i.quantityOut!, 0)}`}
            />

            <Input type="hidden" name="inOut" bind:value={$form.inOut} />
            <Input
              label="Vikt"
              type="number"
              name="quantityOut"
              class="input bg-base-300"
              bind:value={$form.quantityOut}
            />

            <Input
              label="Antal flaskor"
              type="number"
              name="nrBottles"
              class="input bg-base-300"
              bind:value={$form.nrBottles}
            />

            <Input
              label="Datum"
              type="date"
              name="date"
              class="input bg-base-300"
              bind:value={$form.date}
            />
          {/if}
        {/if}

        <div class="flex justify-end">
          <button type="submit" class=" btn btn-primary mt-2 w-4/12">Add</button
          >
        </div>
      </form>
    </div>
  {/if}
{/if}
