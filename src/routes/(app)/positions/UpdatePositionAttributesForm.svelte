<script lang="ts">
  import type { Position } from "@prisma/client";
  import Labeled from "$lib/components/Labeled.svelte";
  import type { UpdatePositionAttributeSchema } from "./+page.server";
  import type { SuperValidated } from "sveltekit-superforms";
  import { superForm } from "$lib/utils/client/superForms";
  import * as m from "$paraglide/messages";

  export let position: Position;
  export let data: SuperValidated<UpdatePositionAttributeSchema>;
  const { form, errors, constraints, isTainted, tainted, enhance } =
    superForm(data);
  $: correctConstraints = ((c) => {
    if (c.active !== undefined) c.active.required = false;
    if (c.isBoardMember !== undefined) c.isBoardMember.required = false;
    return c;
  })($constraints);
</script>

<form action="?/update" method="POST" style="display:contents" use:enhance>
  <input type="hidden" name="id" value={position.id} />
  <input type="hidden" name="active" value="false" />
  <Labeled label={m.positions_active()}>
    <input
      type="checkbox"
      name="active"
      id="active"
      value="active"
      bind:checked={$form.active}
      {...$constraints.active}
    />
    {#if $errors.active}
      <p class="text-error">{$errors.active}</p>
    {/if}
  </Labeled>
  <input type="hidden" name="isBoardMember" value="false" />
  <Labeled label={m.positions_board_member()}>
    <input
      type="checkbox"
      name="isBoardMember"
      id="isBoardMember"
      value="isBoardMember"
      bind:checked={$form.isBoardMember}
      {...$constraints.isBoardMember}
    />
    {#if $errors.isBoardMember}
      <p class="text-error">{$errors.isBoardMember}</p>
    {/if}
  </Labeled>
  <input
    type="submit"
    value={m.positions_apply_change()}
    disabled={!isTainted($tainted)}
    class="btn btn-secondary"
  />
</form>
