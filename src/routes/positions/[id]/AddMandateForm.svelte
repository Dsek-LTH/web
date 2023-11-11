<script lang="ts">
  import { enhance } from "$app/forms";
  import Labeled from "$lib/components/Labeled.svelte";
  import MemberSearchInput from "$lib/components/MemberSearchInput.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { AddMandateSchema } from "./+page.server";
  import { superForm } from "sveltekit-superforms/client";

  export let data: SuperValidated<AddMandateSchema>;
  const { form, errors, constraints } = superForm(data);
  export let onClose: () => void;
</script>

<form
  action="?/addMandate"
  method="POST"
  use:enhance={() => {
    return async ({ update }) => {
      onClose();
      await update();
    };
  }}
  class="form-control my-2 flex-row items-end gap-2"
>
  <div class="flex flex-1 flex-col items-stretch">
    <MemberSearchInput />
    {#if $errors.startDate}
      <p class="text-error">{$errors.startDate}</p>
    {/if}
  </div>
  <Labeled label="Start" id="startDate">
    <input
      name="startDate"
      id="startDate"
      value={$form.startDate}
      class="input input-bordered"
      type="date"
      {...$constraints.startDate}
    />
  </Labeled>
  {#if $errors.startDate}
    <p class="text-error">{$errors.startDate}</p>
  {/if}
  <Labeled label="End" id="endDate">
    <input
      name="endDate"
      id="endDate"
      value={$form.endDate}
      class="input input-bordered"
      type="date"
      {...$constraints.endDate}
    />
  </Labeled>
  {#if $errors.endDate}
    <p class="text-error">{$errors.endDate}</p>
  {/if}
  <button type="submit" class="btn btn-secondary">Spara</button>
</form>
