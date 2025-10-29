<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import type { PageData } from "./$types";
  import { DrinkQuantityType } from "@prisma/client";
  import Input from "$lib/components/Input.svelte";
  import Labeled from "$lib/components/Labeled.svelte";

  let selected: string | "" = "";

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
      if (selected === "IN" || selected === "OUT") {
        $form.inOut = selected;
      }
    }}
  >
    <option value="" disabled selected>Välj kategori</option>
    <option value={"IN"}>Skriv in</option>
    <option value={"OUT"}>Skriv ut</option>
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
      <select class="input bg-base-300" bind:value={$form.drinkItemId}>
        {#each data.drinks as drink}
          <option value={drink.id}> {drink.name} </option>{/each}</select
      >
      <Input
        label="Antal"
        type="number"
        name="quantity"
        class="input bg-base-300"
        bind:value={$form.quantity}
      />
      <Input
        label="Utgångsdatum"
        type="datetime-local"
        name="bestbeforedate"
        class="input bg-base-300"
        bind:value={$form.bestBeforeDate}
      />
      <div class="flex justify-end">
        <button type="submit" class=" btn btn-primary mt-2 w-4/12">Add</button>
      </div>
    </form>
  </div>
{/if}
