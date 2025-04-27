<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import type { SpecialReceiver } from "@prisma/client";
  import type { RemoveSpecialReceiverForm } from "./schema";
  import * as m from "$paraglide/messages";

  interface Props {
    specialReceiver: SpecialReceiver;
    isEditing: boolean;
    removeReceiverForm: SuperValidated<RemoveSpecialReceiverForm>;
  }

  let { specialReceiver, isEditing, removeReceiverForm }: Props = $props();
  const { enhance: removeReceiverEnhance } = superForm(removeReceiverForm);
</script>

<div class="flex flex-row items-center justify-between border-b border-neutral">
  <p class="my-4 font-mono">{specialReceiver.targetEmail}</p>
  <form
    action="?/removeSpecialReceiver"
    method="post"
    class="flex flex-row"
    use:removeReceiverEnhance
  >
    <input type="hidden" name="id" value={specialReceiver.id} />
    <input type="hidden" name="email" value={specialReceiver.email} />
    <input
      type="hidden"
      name="targetEmailreceiver"
      value={specialReceiver.targetEmail}
    />
    {#if isEditing}
      <button class="btn btn-error btn-xs" type="submit">
        {m.admin_emailalias_removeSpecialReceiver()}
      </button>
    {/if}
  </form>
</div>
