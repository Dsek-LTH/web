<script lang="ts">
  import Labeled from "$lib/components/Labeled.svelte";
  import type { TicketSchema } from "$lib/components/shop/types";
  import { formFieldProxy, type SuperForm } from "sveltekit-superforms/client";

  export let superform: SuperForm<TicketSchema>;
  const { value, errors, constraints } = formFieldProxy(
    superform,
    "maxAmountPerUser",
  );
</script>

<Labeled label="Max antal biljetter per person" error={$errors}>
  <input
    id="maxAmountPerUser"
    name="maxAmountPerUser"
    bind:value={$value}
    class={"input input-bordered hover:border-base-content"}
    {...$constraints}
    type="number"
  />
</Labeled>
