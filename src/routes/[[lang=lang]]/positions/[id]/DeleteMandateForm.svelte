<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "sveltekit-superforms/client";
  import type { DeleteMandateSchema } from "./+page.server";

  export let mandateId: string;
  export let data: SuperValidated<DeleteMandateSchema>;
  const { errors, enhance } = superForm(data, {
    id: mandateId,
  });
</script>

<form action="?/deleteMandate" method="POST" use:enhance>
  <input type="hidden" name="mandateId" value={mandateId} />
  <button
    type="submit"
    class="btn btn-error btn-sm pointer-events-auto"
    on:click|stopPropagation={() => {}}
  >
    X
  </button>
  {#if $errors.mandateId}
    <p class="text-error">{$errors.mandateId}</p>
  {/if}
</form>
