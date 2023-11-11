<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { UpdateMandateSchema } from "./+page.server";
  import { superForm } from "sveltekit-superforms/client";
  export let data: SuperValidated<UpdateMandateSchema>;
  export let mandateId: string;
  const { form, errors, constraints, enhance, message } = superForm(data, {
    onError(event) {
      message.set(event.result.error.message);
    },
  });
</script>

<form
  action="?/updateMandate"
  method="POST"
  use:enhance
  class="form-control my-2 flex-row items-end gap-2"
>
  <input type="hidden" name="mandateId" value={mandateId} />
  <Labeled label="Start" id="startDate">
    <input
      name="startDate"
      id="startDate"
      value={$form.startDate?.toISOString().split("T")[0]}
      class="input input-bordered"
      type="date"
      {...$constraints.startDate}
    />
    {#if $errors.startDate}
      <p class="text-error">{$errors.startDate}</p>
    {/if}
  </Labeled>
  <Labeled label="End" id="endDate">
    <input
      name="endDate"
      id="endDate"
      value={$form.endDate?.toISOString().split("T")[0]}
      class="input input-bordered"
      type="date"
      {...$constraints.endDate}
    />
    {#if $errors.endDate}
      <p class="text-error">{$errors.endDate}</p>
    {/if}
  </Labeled>
  <button type="submit" class="btn btn-secondary">Spara</button>
</form>

{#if $message}
  <p class="text-error">{$message}</p>
{/if}
