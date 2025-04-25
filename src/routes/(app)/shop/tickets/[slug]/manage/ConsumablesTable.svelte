<script lang="ts">
  import type { ItemQuestion } from "@prisma/client";
  import ConsumableRow from "./ConsumableRow.svelte";
  import type { ConsumableRowData, ReservationData } from "./types";

  interface Props {
    title?: string | null;
    questions?: ItemQuestion[];
    consumables: Array<ConsumableRowData | ReservationData>;
  }

  let { title = null, questions = [], consumables }: Props = $props();
</script>

<div class="my-8 overflow-x-auto rounded-box bg-base-200 p-2 shadow-xl">
  <table class="table">
    <thead>
      {#if title}
        <tr><th colspan="1000" class="text-center text-lg">{title}</th></tr>
      {/if}
      <tr>
        <th>Person</th>
        <th>Preferens</th>
        <th>Köptes</th>
        <th>Phaddergrupp</th>
        <th>Konsumerades</th>
        <th>Betalat</th>
        <th>Stripeköp ID</th>
        {#each questions as question}
          <th>
            <div class="tooltip" data-tip={question.title}>
              <span
                class="inline-block max-w-32 overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {question.title}
              </span>
            </div></th
          >
        {/each}
        <th>Konsumera</th>
        <th>Återbetala</th>
      </tr>
    </thead>
    <tbody>
      {#if consumables.length > 0}
        {#each consumables as consumable (consumable.id)}
          <!-- The below is a TypeScript "hack" to verify the object type in a union. We check if the field "purchasedAt" exists since that only exists on a consumable. It exists even if is null. -->
          <ConsumableRow
            consumable={"purchasedAt" in consumable
              ? (consumable ?? null)
              : null}
            reservation={"purchasedAt" in consumable ? null : consumable}
            {questions}
          />
        {/each}
      {:else}
        <tr>
          <td colspan="1000" class="text-center">Inga biljetter</td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

<style>
</style>
