<script lang="ts">
  import PositionCard from "./PositionCard.svelte";
  import type { ComponentProps } from "svelte";

  type CardProps = ComponentProps<PositionCard>;
  interface Props {
    positions: Array<
      CardProps["position"] & {
        mandates: CardProps["mandates"];
      }
    >;
  }

  let { positions }: Props = $props();

  let everyOtherPosition = $derived(positions.filter((_, i) => i % 2 === 0));
  let everyOtherPosition2 = $derived(positions.filter((_, i) => i % 2 === 1));
</script>

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
  {#each positions as position (position.id)}
    <PositionCard {position} mandates={position.mandates} />
  {/each}
</div>
