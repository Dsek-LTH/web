<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import PositionCard from "./PositionCard.svelte";

  export let data;
  $: everyOtherPosition = data.positions.filter((_, i) => i % 2 === 0);
  $: everyOtherPosition2 = data.positions.filter((_, i) => i % 2 === 1);
</script>

<PageHeader title={data.committee.name} />
<div class="hidden grid-cols-2 gap-4 md:grid">
  <div class="flex flex-col items-stretch gap-4">
    {#each everyOtherPosition as position (position.id)}
      <PositionCard {position} mandates={position.mandates} />
    {/each}
  </div>
  <div class="flex flex-col items-stretch gap-4">
    {#each everyOtherPosition2 as position (position.id)}
      <PositionCard {position} mandates={position.mandates} />
    {/each}
  </div>
</div>
<div class="grid gap-4 md:hidden">
  {#each data.positions as position (position.id)}
    <PositionCard {position} mandates={position.mandates} />
  {/each}
</div>
