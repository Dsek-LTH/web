<script lang="ts">
  import type { CommitteeLoadData } from "../../committee.server";
  import PositionGroupCard from "./PositionGroupCard.svelte";

  import * as m from "$paraglide/messages";

  let { data }: { data: CommitteeLoadData } = $props();

  let leftRow = $derived(data.committee.positions.filter((_, i) => i % 2 == 0));
  let rightRow = $derived(
    data.committee.positions.filter((_, i) => i % 2 == 1),
  );
</script>

<h2>{m.committees_members()}</h2>

<div class="mt-4 flex flex-row gap-4">
  <div class="hidden w-full flex-col gap-4 lg:flex">
    {#each leftRow as position, index (position.id)}
      <PositionGroupCard
        class="w-full"
        index={index * 2}
        {position}
        mandates={position.mandates}
      />
    {/each}
  </div>
  <div class="hidden w-full flex-col gap-4 lg:flex">
    {#each rightRow as position, index (position.id)}
      <PositionGroupCard
        class="w-full"
        index={index * 2 + 1}
        {position}
        mandates={position.mandates}
      />
    {/each}
  </div>
  <div class="flex w-full flex-col gap-4 lg:hidden">
    {#each data.committee.positions as position, index (position.id)}
      <PositionGroupCard
        class="w-full"
        {index}
        {position}
        mandates={position.mandates}
      />
    {/each}
  </div>
</div>
