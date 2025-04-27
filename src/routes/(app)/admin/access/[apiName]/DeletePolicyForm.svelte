<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import type { DeleteSchema } from "./+page.server";

  interface Props {
    data: SuperValidated<DeleteSchema>;
    policyId: string;
  }

  let { data, policyId }: Props = $props();
  const { errors, enhance } = superForm(data, {
    id: policyId,
  });
</script>

<form method="POST" action="?/delete" use:enhance>
  <input type="hidden" name="id" value={policyId} />
  {#if $errors.id}<span class="text-error">{$errors.id}</span>{/if}
  <button type="submit" class="btn btn-xs px-8">Remove</button>
</form>
