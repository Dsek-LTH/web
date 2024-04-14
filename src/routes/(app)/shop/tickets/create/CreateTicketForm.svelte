<script lang="ts">
  import Input from "$lib/components/Input.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { CreateTicketSchema } from "./+page.server";
  import AvailableDates from "./AvailableDates.svelte";
  import MaxAmountPerUser from "./MaxAmountPerUser.svelte";
  import EventSearchInput from "./EventSearchInput.svelte";
  // Assuming you have a schema definition based on zod

  let createForm: SuperValidated<CreateTicketSchema>;
  export { createForm as form };
  const { form, errors, constraints, enhance, submitting } =
    superForm(createForm);
</script>

<form method="POST" class="form-control max-w-xl gap-4" use:enhance>
  <EventSearchInput {form} {constraints} {errors} />
  <Input
    name="title"
    label="Biljettnamn"
    bind:value={$form.title}
    {...$constraints.title}
    error={$errors.title}
  />
  <Input
    name="description"
    label="Biljettbeskrivning"
    bind:value={$form.description}
    {...$constraints.description}
    error={$errors.description}
  />
  <Input
    name="titleEn"
    label="Engelskt biljettnamn"
    bind:value={$form.titleEn}
    {...$constraints.titleEn}
    error={$errors.titleEn}
    optional
  />
  <Input
    name="descriptionEn"
    label="Engelsk beskrivning"
    bind:value={$form.descriptionEn}
    {...$constraints.descriptionEn}
    error={$errors.descriptionEn}
    optional
  />
  <Input
    name="price"
    label="Pris (i öre)"
    bind:value={$form.price}
    {...$constraints.price}
    error={$errors.price}
    type="number"
  />
  <AvailableDates {form} {constraints} {errors} />
  <Input
    name="stock"
    label="Antal biljetter till salu"
    bind:value={$form.stock}
    {...$constraints.stock}
    error={$errors.stock}
    type="number"
  />
  <MaxAmountPerUser {form} {constraints} {errors} />
  <button type="submit" disabled={$submitting} class="btn btn-primary mt-4">
    {$submitting ? "Skapar..." : "Skapa biljett"}
  </button>
</form>
