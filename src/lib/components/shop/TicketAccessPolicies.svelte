<script lang="ts">
  import TicketAccessPolicyRow from "$lib/components/shop/TicketAccessPolicyRow.svelte";
  import type { TicketSchema } from "$lib/utils/shop/types";
  import {
    arrayProxy,
    type ArrayProxy,
    type SuperForm,
  } from "sveltekit-superforms/client";

  interface Props {
    superform: SuperForm<TicketSchema>;
  }

  let { superform }: Props = $props();
  const { values, errors } = arrayProxy(
    superform,
    "accessPolicies",
  ) as ArrayProxy<NonNullable<TicketSchema["accessPolicies"]>[number]>;
</script>

<section class="space-y-2">
  <h5 class="font-semibold">Access</h5>
  {#if $values !== undefined}
    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
    {#each $values as _, index}
      <TicketAccessPolicyRow
        {superform}
        {index}
        onRemove={() => {
          $values = [...$values.slice(0, index), ...$values.slice(index + 1)];
        }}
      />
    {/each}
  {/if}
  <button
    type="button"
    class="btn btn-primary"
    onclick={() => {
      if ($values === undefined) {
        $values = [{ role: null, studentId: null }];
      } else {
        $values = [...$values, { role: null, studentId: null }];
      }
    }}>+ lägg till policy</button
  >

  {#if $errors}
    {#each $errors as error}
      <div class="label">
        <span class="label-text-alt text-error">
          {error}
        </span>
      </div>
    {/each}
  {/if}
</section>
