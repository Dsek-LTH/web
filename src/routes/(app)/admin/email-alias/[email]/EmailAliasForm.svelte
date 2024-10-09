<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import type { EmailAlias, Position } from "@prisma/client";
  import type { RemovePositionForm, SetCanSendForm } from "./schema";
  import * as m from "$paraglide/messages";

  export let emailAlias: EmailAlias & { position: Position };
  export let canSendForm: SuperValidated<SetCanSendForm>;
  export let isEditing: boolean;
  const { enhance: canSendEnchance } = superForm(canSendForm, {
    id: emailAlias.id,
  });

  let canSendFormHTML: HTMLFormElement;

  export let removePositionForm: SuperValidated<RemovePositionForm>;
  const { enhance: removePositionEnhance } = superForm(removePositionForm);
</script>

<div class="flex flex-row items-center justify-between border-b border-neutral">
  <form
    action="?/setCanSend"
    method="post"
    class="flex flex-row"
    use:canSendEnchance
    bind:this={canSendFormHTML}
  >
    <div class="my-4 flex flex-row gap-6">
      <h1 class="font-medium">{emailAlias.position.name}</h1>
      <input type="hidden" name="aliasId" value={emailAlias.id} />
      <input type="hidden" name="canSend" value={emailAlias.canSend} />
      <p class="font-mono">{emailAlias.positionId}</p>
      <label for="canSend">{m.admin_emailalias_canSend()}</label>
      {#if isEditing}
        <input
          type="checkbox"
          name="canSend"
          id="canSend"
          class="toggle toggle-primary"
          on:click={async () => {
            emailAlias.canSend = !emailAlias.canSend;
            setTimeout(() => {
              canSendFormHTML.requestSubmit();
            }, 0);
          }}
          checked={emailAlias.canSend}
        />
      {:else}
        <input
          type="checkbox"
          class="toggle toggle-primary pointer-events-none"
          checked={emailAlias.canSend}
        />
      {/if}
    </div>
  </form>

  <form
    action="?/removePosition"
    method="post"
    class="flex flex-row"
    use:removePositionEnhance
  >
    <input type="hidden" name="aliasId" value={emailAlias.id} />
    <input type="hidden" name="positionId" value={emailAlias.positionId} />
    <input type="hidden" name="email" value={emailAlias.email} />
    {#if isEditing}
      <button class="btn btn-error btn-xs" type="submit">
        {m.admin_emailalias_removePosition()}
      </button>
    {/if}
  </form>
</div>
