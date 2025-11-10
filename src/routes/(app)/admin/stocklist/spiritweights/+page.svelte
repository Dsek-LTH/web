<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import { superForm } from "$lib/utils/client/superForms";
  import type { PageData } from "./$types";
  import { DrinkGroup } from "@prisma/client";

  export let data: PageData;

  const { form, enhance, message } = superForm(data.form, {
    resetForm: true,
  });

  // Initialize form values to prevent binding to undefined
  $: if ($form.weight === undefined) $form.weight = null;
  $: if ($form.emptyWeight === undefined) $form.emptyWeight = null;

  // Form visibility state
  let showForm = false;

  function toggleForm() {
    showForm = !showForm;
  }

  function getSpiritWeight(spirit: any) {
    if (spirit.weight && spirit.emptyWeight) {
      return spirit.weight - spirit.emptyWeight;
    }
    return null;
  }
</script>

<!-- Navigation -->
<div class="mb-6">
  <a href="/admin/stocklist" class="btn btn-primary mr-2">Överblick</a>
  <a href="/admin/stocklist/addproduct" class="btn btn-primary mr-2"
    >Lägg till produkt</a
  >
  <a href="/admin/stocklist/stockchange" class="btn btn-primary mr-2"
    >Skriv in/ut</a
  >
  <a href="/admin/stocklist/spiritweights" class="btn btn-secondary mr-2"
    >Spritvikter</a
  >
</div>

{#if $message}
  <div class="alert alert-success mb-4">
    <span>{$message.message}</span>
  </div>
{/if}

<h1 class="mb-4 text-2xl font-bold">Spritvikter</h1>

<!-- Add Form Button -->
<div class="mb-6">
  <button type="button" class="btn btn-primary" on:click={toggleForm}>
    {showForm ? "Stäng formulär" : "Lägg till ny sprit"}
  </button>
</div>

<!-- Add Form -->
{#if showForm}
  <div class="card mb-6 bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Lägg till sprit</h2>
      <form
        method="POST"
        action="?/addSpirit"
        use:enhance
        class="grid grid-cols-2 gap-4"
      >
        <Input label="Namn" name="name" bind:value={$form.name} required />
        <Input
          label="Systembolaget ID"
          name="systembolagetID"
          type="number"
          bind:value={$form.systembolagetID}
          required
        />
        <Input
          label="Pris (kr)"
          name="price"
          type="number"
          step="0.01"
          bind:value={$form.price}
          required
        />
        <div>
          <label class="label" for="group-select">Grupp</label>
          <select
            id="group-select"
            name="group"
            bind:value={$form.group}
            class="select select-bordered w-full"
            required
          >
            <option value="">Välj grupp</option>
            {#each Object.values(DrinkGroup) as group}
              <option value={group}>{group}</option>
            {/each}
          </select>
        </div>
        <Input
          label="Total vikt (g)"
          name="weight"
          type="number"
          value={$form.weight || ""}
          placeholder="750"
        />
        <Input
          label="Tom flaska (g)"
          name="emptyWeight"
          type="number"
          value={$form.emptyWeight || ""}
          placeholder="200"
        />
        <div class="col-span-2">
          <button type="submit" class="btn btn-primary">Lägg till</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Table -->
<div class="overflow-x-auto">
  <table class="table">
    <thead>
      <tr>
        <th>Namn</th>
        <th>Systembolaget ID</th>
        <th>Pris</th>
        <th>Grupp</th>
        <th>Total vikt (g)</th>
        <th>Tom flaska (g)</th>
        <th>Sprit vikt (g)</th>
      </tr>
    </thead>
    <tbody>
      {#each data.spirits as spirit}
        <tr>
          <td>{spirit.name}</td>
          <td>{spirit.systembolagetID}</td>
          <td>{(spirit.price / 100).toFixed(2)} kr</td>
          <td>{spirit.group}</td>
          <td>{spirit.weight || "-"}</td>
          <td>{spirit.emptyWeight || "-"}</td>
          <td class="font-bold text-green-600">
            {getSpiritWeight(spirit) || "-"}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
