<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { UpdatePositionSchema } from "./+page.server";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { buttonVariants } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";

  let {
    data,
    onSubmit,
  }: { data: SuperValidated<UpdatePositionSchema>; onSubmit: () => void } =
    $props();

  const { form, errors, constraints, enhance } = $derived(
    superForm(data, {
      onSubmit,
    }),
  );
</script>

<form action="?/update" method="POST" use:enhance>
  <div class="flex flex-col gap-4 px-4">
    <h5>{m.positions_updating()}</h5>
    <div class="flex flex-col gap-1.5">
      <Label>{m.positions_name()}</Label>
      <Input
        type="text"
        name="name"
        id="name"
        value={$form.name ?? ""}
        aria-invalid={!!$errors.name}
        aria-errormessage={$errors.name?.at(0)}
        {...$constraints.name}
      />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label>{m.positions_description()}</Label>
      <Textarea
        name="description"
        id="description"
        rows={3}
        value={$form.description ?? ""}
        aria-invalid={!!$errors.description}
        aria-errormessage={$errors.description?.at(0)}
        {...$constraints.description}
      />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label>
        {m.positions_emailAddress()}</Label
      >
      <span class="text-sm">{m.positions_emailNotice()}</span>

      <Input
        name="email"
        id="email"
        type="email"
        value={$form.email}
        aria-invalid={!!$errors.email}
        aria-errormessage={$errors.email?.at(0)}
        {...$constraints.email}
      />
    </div>
  </div>
  <Dialog.Footer class="mt-4 w-full rounded-b-md px-4 py-2">
    <Dialog.Close type="button" class={buttonVariants({ variant: "outline" })}
      >{m.cancel()}</Dialog.Close
    >
    <Dialog.Close class={buttonVariants({ variant: "rosa" })} type="submit"
      >{m.save()}</Dialog.Close
    >
  </Dialog.Footer>
</form>
