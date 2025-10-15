<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import MemberSearchInput from "$lib/components/forms/MemberSearchInput.svelte";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { AddMandateSchema } from "./+page.server";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

  export let data: SuperValidated<AddMandateSchema>;
  export let onClose: () => void;
  const { form, errors, constraints, enhance } = superForm(data, {
    onResult(event) {
      if (event.result.type === "success") onClose();
    },
  });
  let member: ExtendedPrismaModel<"Member"> | undefined;
</script>

<form
  action="?/addMandate"
  method="POST"
  use:enhance
  class="form-control my-2 flex-row items-end gap-2"
>
  <div class="flex flex-1 flex-col items-stretch">
    <input type="hidden" name="memberId" value={member?.id} />
    <MemberSearchInput bind:member />
    {#if $errors.memberId}
      <p class="text-error">{$errors.memberId}</p>
    {/if}
  </div>
  <Labeled label={m.positions_startDate()}>
    <input
      name="startDate"
      id="startDate"
      value={$form.startDate?.toISOString().split("T")[0]}
      class="input input-bordered"
      type="date"
      {...$constraints.startDate}
    />
  </Labeled>
  {#if $errors.startDate}
    <p class="text-error">{$errors.startDate}</p>
  {/if}
  <Labeled label={m.positions_endDate()}>
    <input
      name="endDate"
      id="endDate"
      value={$form.endDate?.toISOString().split("T")[0]}
      class="input input-bordered"
      type="date"
      {...$constraints.endDate}
    />
  </Labeled>
  {#if $errors.endDate}
    <p class="text-error">{$errors.endDate}</p>
  {/if}
  <button type="submit" class="btn btn-secondary">{m.positions_save()}</button>
</form>
