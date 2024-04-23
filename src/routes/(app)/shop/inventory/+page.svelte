<script lang="ts">
  import { now } from "$lib/stores/date";
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
  <h1 class="text-2xl font-bold">Din kista</h1>

  <ConsumableSection title="Biljetter" consumables={unconsumed} />
  <ConsumableSection title="Använda" consumables={consumed} />
</article>
