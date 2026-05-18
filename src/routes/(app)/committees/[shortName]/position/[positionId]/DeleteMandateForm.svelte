<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";
  import type { DeleteMandateSchema } from "./+page.server";
  import { Button } from "$lib/components/ui/button";
  import Trash from "@lucide/svelte/icons/trash";
  import { setContext } from "svelte";

  let {
    data,
    mandateId,
    onsubmit,
  }: {
    data: SuperValidated<DeleteMandateSchema>;
    mandateId: string;
    onsubmit: () => void;
  } = $props();

  const { errors, enhance } = $derived(
    superForm(data, {
      id: mandateId,
      onResult() {
        onsubmit();
      },
    }),
  );
</script>

<form
  action="?/deleteMandate"
  method="POST"
  use:enhance
  onsubmit={() => setContext("mandateSubmit", true)}
>
  <input type="hidden" name="mandateId" value={mandateId} />
  <Button variant="lila" type="submit" size="sm">
    <Trash />
    {m.positions_removeMandate()}
  </Button>
  {#if $errors.mandateId}
    <p class="text-error">{$errors.mandateId}</p>
  {/if}
</form>
