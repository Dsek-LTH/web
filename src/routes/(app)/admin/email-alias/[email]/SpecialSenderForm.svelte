<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import type { SpecialSender } from "@prisma/client";
  import type { RemoveSpecialSenderForm } from "./schema";
  import * as m from "$paraglide/messages";

  export let specialSender: SpecialSender;
  export let isEditing: boolean;

  export let removeSenderForm: SuperValidated<RemoveSpecialSenderForm>;
  const { enhance: removeSenderEnhance } = superForm(removeSenderForm);
</script>

<div class="flex flex-row items-center justify-between border-b border-neutral">
  <div class="my-4 flex flex-row gap-6">
    <p class="font-mono">{specialSender.studentId}</p>
    <p class="font-mono">{specialSender.keycloakId}</p>
  </div>
  <form
    action="?/removeSpecialSender"
    method="post"
    class="flex flex-row"
    use:removeSenderEnhance
  >
    <input type="hidden" name="id" value={specialSender.id} />
    {#if isEditing}
      <button class="btn btn-error btn-xs" type="submit">
        {m.admin_emailalias_removeSpecialSender()}
      </button>
    {/if}
  </form>
</div>
