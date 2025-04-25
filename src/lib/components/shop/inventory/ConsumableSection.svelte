<script lang="ts">
  import type { ConsumableWithMoreInfo } from "$lib/server/shop/inventory/types";
  import Consumable from "./Consumable.svelte";

  interface Props {
    title: string;
    consumables: ConsumableWithMoreInfo[];
  }

  let { title, consumables }: Props = $props();
</script>

{#if consumables.length > 0}
  <section>
    <h2 class="mb-1 text-lg font-semibold">{title}</h2>
    <div
      class="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-3"
    >
      {#each consumables as consumable (consumable.id)}
        <Consumable {consumable} />
      {/each}
    </div>
  </section>
{/if}
