<script lang="ts">
  import { createBubbler, stopPropagation } from "svelte/legacy";

  const bubble = createBubbler();
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import type { DeleteMandateSchema } from "./+page.server";

  interface Props {
    mandateId: string;
    data: SuperValidated<DeleteMandateSchema>;
  }

  let { mandateId, data }: Props = $props();
  const { errors, enhance } = superForm(data, {
    id: mandateId,
  });
</script>

<form action="?/deleteMandate" method="POST" use:enhance>
  <input type="hidden" name="mandateId" value={mandateId} />
  <button
    type="submit"
    class="btn btn-error btn-sm pointer-events-auto"
    onclick={stopPropagation(bubble("click"))}
  >
    X
  </button>
  {#if $errors.mandateId}
    <p class="text-error">{$errors.mandateId}</p>
  {/if}
</form>
