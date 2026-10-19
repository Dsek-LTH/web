<script lang="ts">
  import { superForm } from "$lib/utils/client/superForms";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as m from "$paraglide/messages.js";
  import type { UpdatePositionAttributeSchema } from "./+page.server";
  import type { SuperValidated } from "sveltekit-superforms";

  let {
    position,
    updateForm,
    canUpdate,
  }: {
    position: { id: string; name: string; email: string | null };
    updateForm: SuperValidated<UpdatePositionAttributeSchema>;
    canUpdate: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  const { form, enhance, submitting } = superForm(updateForm, {
    id: position.id,
  });
</script>

<form
  method="POST"
  action="?/update"
  use:enhance
  class="flex flex-wrap items-center justify-between gap-4 py-3"
>
  <input type="hidden" name="id" value={position.id} />
  <div class="min-w-0 flex-1">
    <p class="truncate font-medium">{position.name}</p>
    {#if position.email}
      <p class="text-muted-foreground truncate text-sm">{position.email}</p>
    {/if}
  </div>

  <div class="flex items-center gap-6">
    <div class="flex items-center gap-2">
      <Switch
        id="active-{position.id}"
        name="active"
        bind:checked={$form.active}
        disabled={!canUpdate}
      />
      <Label for="active-{position.id}">{m.positions_active()}</Label>
    </div>
    <div class="flex items-center gap-2">
      <Switch
        id="boardMember-{position.id}"
        name="boardMember"
        bind:checked={$form.boardMember}
        disabled={!canUpdate}
      />
      <Label for="boardMember-{position.id}">{m.positions_board_member()}</Label
      >
    </div>
    {#if canUpdate}
      <Button type="submit" size="sm" variant="outline" disabled={$submitting}>
        {m.positions_save()}
      </Button>
    {/if}
  </div>
</form>
