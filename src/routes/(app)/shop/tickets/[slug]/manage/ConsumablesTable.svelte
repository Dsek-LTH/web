<script lang="ts">
  import type {
    Consumable,
    ConsumableReservation,
    Member,
  } from "@prisma/client";
  import ConsumableRow from "./ConsumableRow.svelte";

  export let title: string | null = null;
  export let consumables: Array<
    (Consumable | ConsumableReservation) & {
      member: Member | null;
    }
  >;
</script>

<div class="my-8 overflow-x-auto bg-base-200 p-2 shadow-xl">
  <table class="table">
    <thead>
      {#if title}
        <tr><th colspan="8" class="text-center text-lg">{title}</th></tr>
      {/if}
      <tr>
        <th>Person</th>
        <th>Preferens</th>
        <th>Köptes</th>
        <th>Konsumerades</th>
        <th>Betalat</th>
        <th>Stripeköp ID</th>
        <th>Konsumera</th>
        <th>Återbetala</th>
      </tr>
    </thead>
    <tbody>
      {#if consumables.length > 0}
        {#each consumables as consumable (consumable.id)}
          <!-- The below is a TypeScript "hack" to verify the object type in a union. We check if the field "purchasedAt" exists since that only exists on a consumable. It exists even if is null. -->
          <ConsumableRow
            consumable={"purchasedAt" in consumable ? consumable : null}
            reservation={"purchasedAt" in consumable ? null : consumable}
          />
        {/each}
      {:else}
        <tr>
          <td colspan="8" class="text-center">Inga biljetter</td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>
