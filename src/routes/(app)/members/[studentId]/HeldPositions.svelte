<script lang="ts">
  import HeldPositionsYear from "./HeldPositionsYear.svelte";
  import type { MandateWithPositionAndCommitte } from "./types";

  export let mandates: MandateWithPositionAndCommitte[];
  $: mandatesGroupedByYear = mandates.reduce<
    Record<string, MandateWithPositionAndCommitte[]>
  >((acc, mandate) => {
    let year = mandate.startDate.getFullYear().toString();
    if (mandate.endDate.getFullYear() !== mandate.startDate.getFullYear())
      year += `-${mandate.endDate.getFullYear()}`;
    if (!acc[year]) acc[year] = [];
    acc[year]!.push(mandate);
    return acc;
  }, {});
  $: years = Object.keys(mandatesGroupedByYear).sort((a, b) =>
    b.localeCompare(a, "sv"),
  );
</script>

<div class="flex-1 md:flex-grow-0">
  <h2 class="mb-2 text-lg">Innehavda poster</h2>
  {#each years as year (year)}
    {@const mandates = mandatesGroupedByYear?.[year]}
    {#if mandates && mandates.length > 0}
      <HeldPositionsYear {mandates} {year} />
    {/if}
  {/each}
</div>
