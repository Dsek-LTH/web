<script lang="ts">
  import type { SuperValidated } from "sveltekit-superforms";
  import type { RemovePositionForm, SetCanSendForm } from "./+page.server";
  import { superForm } from "sveltekit-superforms/client";
  import type { EmailAlias, Position } from "@prisma/client";

  export let emailAlias: EmailAlias & { position: Position };
  export let canSendForm: SuperValidated<SetCanSendForm>;
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
    <div class="flex flex-row gap-6 py-4">
      <h1 class="font-medium">{emailAlias.position.name}</h1>
      <input type="hidden" name="aliasId" value={emailAlias.id} />
      <input type="hidden" name="canSend" value={emailAlias.canSend} />
      <p class="font-mono">{emailAlias.positionId}</p>
      <label for="canSend">Kan skicka?</label>
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
      <!-- <button
        type="submit"
        class="btn btn-primary btn-xs"
        on:click={async () => {
          emailAlias.canSend = !emailAlias.canSend;
        }}
      >
        {emailAlias.canSend ? "Ja" : "Nej"}
      </button> -->
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
    <button class="btn btn-error btn-xs" type="submit"> Ta bort posten </button>
  </form>
</div>
