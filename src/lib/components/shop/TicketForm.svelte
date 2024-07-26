<script lang="ts">
  import FormInput from "$lib/components/forms/FormInput.svelte";
  import type { TicketSchema } from "$lib/components/shop/types";
  import type { Event } from "@prisma/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import AvailableDates from "./AvailableDates.svelte";
  import EventSearchInput from "./EventSearchInput.svelte";
  import MaxAmountPerUser from "./MaxAmountPerUser.svelte";
  import PriceInput from "./PriceInput.svelte";
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

<form method="POST" class="form-control max-w-xl gap-4" use:enhance>
  <EventSearchInput {superform} {event} />
  <FormInput {superform} field="title" label="Biljettnamn" />
  <FormInput {superform} field="description" label="Biljettbeskrivning" />
  <FormInput {superform} field="titleEn" label="Engelskt biljettnamn" />
  <FormInput {superform} field="descriptionEn" label="Engelsk beskrivning" />
  <PriceInput {superform} />
  <AvailableDates {superform} />
  <FormInput
    {superform}
    field="stock"
    label="Antal biljetter till salu"
    type="number"
  />
  <MaxAmountPerUser {superform} />
  <button type="submit" disabled={$submitting} class="btn btn-primary mt-4">
    {#if type === "edit"}
      {$submitting ? "Uppdaterar..." : "Uppdatera biljett"}
    {:else}
      {$submitting ? "Skapar..." : "Skapa biljett"}
    {/if}
  </button>
</form>
