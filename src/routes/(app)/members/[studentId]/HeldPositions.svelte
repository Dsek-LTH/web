<script lang="ts">
  import * as m from "$paraglide/messages";
  import { languageTag } from "$paraglide/runtime";
  import type { PhadderGroup } from "@prisma/client";
  import HeldPositionsYear from "./HeldPositionsYear.svelte";
  import type { MandateWithPositionAndCommitte } from "./types";

  export let mandates: MandateWithPositionAndCommitte[];
  export let nollaIn: PhadderGroup | null = null;
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
  $: years = (
    nollaIn &&
    !Object.keys(mandatesGroupedByYear).includes(nollaIn.year.toString())
      ? [nollaIn.year.toString(), ...Object.keys(mandatesGroupedByYear)]
      : Object.keys(mandatesGroupedByYear)
  ).sort((a, b) => b.localeCompare(a, languageTag()));
</script>

<div class="flex-1 md:flex-grow-0">
  <h2 class="mb-2 text-lg">{m.members_heldPositions()}</h2>
  {#each years as year (year)}
    {@const mandates = mandatesGroupedByYear[year]}
    {#if mandates && mandates.length > 0}
      <HeldPositionsYear {mandates} {year} />
    {/if}
    {#if nollaIn?.year.toString() === year}
      <div class="-mx-4 -mt-4 mb-4">
        <a
          href="/committees/nollu?year={nollaIn.year}"
          class="btn btn-ghost w-full justify-start gap-2 font-medium normal-case text-primary"
        >
          {#if nollaIn.imageUrl}
            <figure class="h-8 w-8 overflow-hidden rounded-sm">
              <img src={nollaIn.imageUrl} alt="Group logo" />
            </figure>
          {/if}
          <span>
            Nolla i <span class="font-bold text-primary">"{nollaIn?.name}"</span
            ></span
          >
        </a>
      </div>
    {/if}
  {/each}
</div>
