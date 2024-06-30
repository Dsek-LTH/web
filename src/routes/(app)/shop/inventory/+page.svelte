<script lang="ts">
  import PageHeader from "$lib/components/nav/PageHeader.svelte";
  import { now } from "$lib/stores/date";
  import * as m from "$paraglide/messages";
  import ConsumableSection from "./ConsumableSection.svelte";

  export let data;
  $: consumables = data.consumables;
  $: unconsumed = consumables.filter(
    (c) => c.consumedAt === null || c.consumedAt < $now,
  );
  $: consumed = consumables.filter(
    (c) => c.consumedAt !== null && c.consumedAt >= $now,
  );
</script>

<article class="flex flex-col gap-4">
  <PageHeader title={m.inventory_yourInventory()} />

  <ConsumableSection title={m.tickets()} consumables={unconsumed} />
  <ConsumableSection title={m.inventory_usedUp()} consumables={consumed} />
</article>
