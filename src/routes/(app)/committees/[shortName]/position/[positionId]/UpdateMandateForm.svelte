<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { UpdateMandateSchema } from "./+page.server";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import { Label } from "$lib/components/ui/label";
  import { Button } from "$lib/components/ui/button";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";

  let { data }: { data: SuperValidated<UpdateMandateSchema> } = $props();

  const { form, errors, constraints, enhance } = $derived(superForm(data));
</script>

<form
  action="?/updateMandate"
  method="POST"
  use:enhance
  class="my-2 flex flex-row items-end justify-center gap-2"
>
  <input type="hidden" name="mandateId" value={$form.mandateId} />
  <div class="flex flex-col gap-1.5">
    <Label>{m.positions_startDate()}</Label>
    <DatePicker
      name="startDate"
      iso
      class="px-4!"
      bind:value={() => $form.startDate?.toISOString().split("T")[0],
      (d) => (d ? ($form.startDate = new Date(d)) : () => "")}
      error={!!$errors.startDate}
      {...$constraints.startDate}
    />
  </div>
  <div class="flex flex-col gap-1.5">
    <Label>{m.positions_endDate()}</Label>
    <DatePicker
      name="endDate"
      iso
      class="px-4!"
      bind:value={() => $form.endDate?.toISOString().split("T")[0],
      (d) => (d ? ($form.endDate = new Date(d)) : () => "")}
      error={!!$errors.endDate}
      {...$constraints.endDate}
    />
  </div>
  <Button type="submit">{m.positions_save()}</Button>
</form>
