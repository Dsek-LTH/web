<script lang="ts">
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import type { TicketSchema } from "$lib/utils/shop/types";
  import type { Event } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import AvailableDates from "./AvailableDates.svelte";
  import EventSearchInput from "./EventSearchInput.svelte";
  import MaxAmountPerUser from "./MaxAmountPerUser.svelte";
  import PriceInput from "./PriceInput.svelte";
  import ItemQuestionsSection from "$lib/components/shop/ItemQuestionsSection.svelte";
  import FormNumberInput from "$lib/components/forms/FormNumberInput.svelte";
  // Assuming you have a schema definition based on zod

  export let event: Event | undefined = undefined;
  export let type: "create" | "edit" = "create";
  let createForm: SuperValidated<TicketSchema>;
  export { createForm as form };
  const superform = superForm(createForm, {
    dataType: "json",
  });
  const { enhance, submitting } = superform;
</script>

<form
  method="POST"
  class="form-control grid max-w-xl grid-cols-1 gap-4 md:max-w-full md:grid-cols-2"
  use:enhance
>
  <div>
    <EventSearchInput {superform} {event} />
    <FormInput {superform} field="title" label="Biljettnamn" />
    <FormInput {superform} field="description" label="Biljettbeskrivning" />
    <FormInput {superform} field="titleEn" label="Biljettnamn (EN)" />
    <FormInput {superform} field="descriptionEn" label="Beskrivning (EN)" />
    <PriceInput {superform} />
    <AvailableDates {superform} />
    <FormNumberInput
      {superform}
      field="stock"
      label="Antal biljetter till salu"
    />
    <MaxAmountPerUser {superform} />
  </div>
  <ItemQuestionsSection {superform} />
  <button type="submit" disabled={$submitting} class="btn btn-primary mt-4">
    {#if type === "edit"}
      {$submitting ? "Uppdaterar..." : "Uppdatera biljett"}
    {:else}
      {$submitting ? "Skapar..." : "Skapa biljett"}
    {/if}
  </button>
</form>
