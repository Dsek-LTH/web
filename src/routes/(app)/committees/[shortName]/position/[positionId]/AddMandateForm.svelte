<script lang="ts">
  import { type SuperValidated } from "sveltekit-superforms";
  import type { AddMandateSchema } from "./+page.server";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import MemberSelector from "$lib/components/MemberSelector.svelte";
  import { Label } from "$lib/components/ui/label";
  import { Button } from "$lib/components/ui/button";
  import DatePicker from "$lib/components/datetime-selector/DatePicker.svelte";

  let {
    data,
    onClose,
  }: { data: SuperValidated<AddMandateSchema>; onClose: () => void } = $props();

  const { form, errors, constraints, enhance } = $derived(
    superForm(data, {
      dataType: "json",
      onResult(event) {
        if (event.result.type === "success") onClose();
      },
    }),
  );
</script>

<div class="bg-muted-background relative rounded-md border-[1px] p-4">
  <h5>{m.positions_adding()}</h5>
  <form
    action="?/addMandate"
    method="POST"
    use:enhance
    class="my-2 flex flex-row items-end gap-2"
  >
    <div class="flex w-full flex-col gap-1.5">
      <Label>{m.positions_member()}</Label>
      <MemberSelector
        showId={false}
        showClass={true}
        class="w-full! min-w-96 grow"
        inputClass="min-h-12 w-full"
        multiple={true}
        bind:selectedMembersId={$form.memberIds}
      />
      {#if $errors.memberIds}
        <p class="text-rosa-500">{$errors.memberIds}</p>
      {/if}
    </div>
    <div class="flex flex-col gap-1.5">
      <Label>{m.positions_startDate()}</Label>

      <DatePicker
        name="startDate"
        iso
        class="h-12"
        value={$form.startDate?.toISOString().split("T")[0]}
        error={!!$errors.startDate}
        {...$constraints.startDate}
      />
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.positions_endDate()}</Label>
      <DatePicker
        name="endDate"
        iso
        class="h-12"
        value={$form.endDate?.toISOString().split("T")[0]}
        aria-invalid={!!$errors.endDate}
        {...$constraints.endDate}
      />
    </div>
    <Button type="submit">{m.positions_save()}</Button>
  </form>
</div>
