<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import type { DeleteMandateSchema } from "./+page.server";
  import { Button } from "$lib/components/ui/button";
  import Trash from "@lucide/svelte/icons/trash";

  let {
    data,
    mandateId,
  }: { data: SuperValidated<DeleteMandateSchema>; mandateId: string } =
    $props();

  const { errors, enhance } = $derived(
    superForm(data, {
      id: mandateId,
    }),
  );
</script>

<form action="?/deleteMandate" method="POST" use:enhance>
  <input type="hidden" name="mandateId" value={mandateId} />
  <Button variant="lila" type="submit" size="sm">
    <Trash />
    {m.positions_removeMandate()}
  </Button>
  {#if $errors.mandateId}
    <p class="text-error">{$errors.mandateId}</p>
  {/if}
</form>
